"""
CFO Intelligence endpoints
Executive briefing, health score, what-if scenarios, and dynamic dashboard
"""
from fastapi import APIRouter, HTTPException
from typing import List
import json
import logging
import re

from app.models.schemas import (
    BriefingRequest, BriefingResponse,
    HealthScoreResponse,
    ScenarioRequest, ScenarioResponse,
    DashboardRequest, DashboardResponse,
    SuggestionsRequest, SuggestionsResponse,
)
from app.services.briefing_generator import BriefingGenerator
from app.services.health_score import HealthScoreCalculator
from app.services.bedrock_client import get_bedrock_client
from app.services.code_executor import SecureCodeExecutor
from app.routers.files import uploaded_files

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/dashboard", response_model=DashboardResponse)
async def generate_dashboard(request: DashboardRequest):
    """Generate a fully dynamic, schema-agnostic dashboard using LLM + sandboxed code"""
    relevant_files = {}
    for fid in request.file_ids:
        if fid not in uploaded_files:
            raise HTTPException(status_code=404, detail=f"File {fid} not found")
        relevant_files[fid] = uploaded_files[fid]

    bedrock = get_bedrock_client()
    if not bedrock.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")

    named_frames = {}
    var_names = []
    for fid, fdata in relevant_files.items():
        raw = fdata["filename"]
        raw = re.sub(r'\.[^.]+$', '', raw)
        safe = re.sub(r'[^a-zA-Z0-9]', '_', raw).lower().strip('_')
        safe = re.sub(r'_+', '_', safe)
        if safe[0:1].isdigit():
            safe = "df_" + safe
        if safe in named_frames:
            safe = safe + "_" + fid[:4]
        named_frames[safe] = fdata["dataframe"]
        var_names.append(safe)

    schemas_prompt = _build_multi_file_schema_prompt(relevant_files, var_names)

    try:
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.0,
            "system": _build_dashboard_system_prompt(var_names),
            "messages": [{"role": "user", "content": schemas_prompt}],
        }

        response = bedrock.client.invoke_model(
            modelId=bedrock.model_id,
            body=json.dumps(request_body),
        )
        response_body = json.loads(response["body"].read())
        generated_text = response_body["content"][0]["text"]
        llm_result = bedrock._extract_json(generated_text)

        logger.info("LLM dashboard response keys: %s", list(llm_result.keys()))

        pandas_code = llm_result.get("pandas_code", "")
        if not pandas_code:
            raise HTTPException(status_code=500, detail="LLM did not generate pandas code")

        executor = SecureCodeExecutor()
        exec_result = executor.execute_multi(pandas_code, named_frames)

        if exec_result.get("error"):
            logger.error("Pandas execution error: %s", exec_result["error"])
            raise HTTPException(status_code=500, detail=f"Code execution failed: {exec_result['error']}")

        dashboard_data = exec_result.get("result")
        if not dashboard_data or not isinstance(dashboard_data, dict):
            raise HTTPException(status_code=500, detail="Code did not produce a valid result dict")

        kpis = dashboard_data.get("kpis", [])
        charts = dashboard_data.get("charts", [])
        health_breakdown = dashboard_data.get("health_breakdown", llm_result.get("health_breakdown", ""))
        recommendations = dashboard_data.get("recommendations", llm_result.get("recommendations", []))

        for kpi in kpis:
            kpi["value"] = str(kpi.get("value", "N/A"))
            kpi["title"] = str(kpi.get("title", "Metric"))
            if "trend" in kpi and kpi["trend"] is not None:
                kpi["trend"] = str(kpi["trend"])

        _sanitize_charts(charts)

        return DashboardResponse(
            kpis=kpis,
            charts=charts,
            health_breakdown=health_breakdown if health_breakdown else "Dashboard generated successfully from your data.",
            recommendations=recommendations if recommendations else ["Ask me specific questions about your data for deeper analysis."],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Dashboard generation failed")
        raise HTTPException(status_code=500, detail=f"Dashboard generation failed: {str(e)}")


def _sanitize_charts(charts: list):
    import math
    for chart in charts:
        chart["title"] = str(chart.get("title", "Chart"))
        chart["type"] = str(chart.get("type", "bar"))
        chart["xAxisKey"] = str(chart.get("xAxisKey", "name"))
        chart["yAxisKey"] = str(chart.get("yAxisKey", "value"))
        clean_data = []
        for row in chart.get("data", []):
            clean_row = {}
            for k, v in row.items():
                if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                    clean_row[str(k)] = 0
                else:
                    clean_row[str(k)] = v
            clean_data.append(clean_row)
        chart["data"] = clean_data


def _build_multi_file_schema_prompt(files: dict, var_names: list) -> str:
    parts = []
    name_iter = iter(var_names)
    for fid, fdata in files.items():
        schema = fdata["schema"]
        filename = fdata["filename"]
        vname = next(name_iter)
        parts.append(f"\n--- Variable: `{vname}` (from file \"{filename}\", {schema.row_count} rows) ---")
        for col in schema.columns:
            line = f"  - {col.name}: {col.dtype}"
            if col.sample_values:
                line += f" (samples: {col.sample_values[:3]})"
            if col.min_value is not None:
                line += f" [range: {col.min_value} to {col.max_value}, mean: {col.mean_value}]"
            parts.append(line)

    return f"""Here are the schemas for all uploaded DataFrames:
{"".join(parts)}

The DataFrames are ALREADY LOADED as the Python variables shown above. Use them directly.
Analyze these schemas and generate the dashboard."""


def _build_dashboard_system_prompt(var_names: list) -> str:
    vars_list = ", ".join(f"`{v}`" for v in var_names)
    df_note = f"`df` (alias for `{var_names[0]}`)" if len(var_names) == 1 else vars_list

    return f"""You are an AI CFO. A CEO just uploaded financial spreadsheets. Your job: look at the column names, data types, and sample values, then decide the most insightful KPIs and charts to display.

You MUST respond with ONE valid JSON object. No markdown, no code fences, no text outside JSON.

JSON Schema:
{{
  "pandas_code": "<python code string>",
  "health_breakdown": "<1-2 paragraph analysis of the data health>",
  "recommendations": ["rec1", "rec2", "rec3"]
}}

═══════════════════════════════════════════
CRITICAL RULES FOR pandas_code
═══════════════════════════════════════════

THE DATA IS ALREADY LOADED. Available DataFrame variables: {df_note}

ABSOLUTELY FORBIDDEN — any of these will crash:
- pd.read_csv(), pd.read_excel(), pd.read_json() — NO FILE READING
- open(), os.path, pathlib — NO FILE SYSTEM ACCESS
- import statements — ALREADY IMPORTED
- Any file path strings

AVAILABLE: pd (pandas), np (numpy), datetime, timedelta
Use ONLY the pre-loaded DataFrame variables listed above.

The code MUST assign `result` as a dict with this EXACT structure:

result = {{
    "kpis": [
        {{"title": "Human-readable metric name", "value": "$1,234", "trend": "+5.2%"}},
        ...up to 6 KPIs
    ],
    "charts": [
        {{
            "title": "Chart Title",
            "type": "bar",
            "xAxisKey": "the_x_column_key",
            "yAxisKey": "the_y_column_key",
            "data": [{{"the_x_column_key": "Label", "the_y_column_key": 123}}, ...]
        }},
        ...exactly 2 charts
    ],
    "health_breakdown": "paragraph about data health",
    "recommendations": ["rec1", "rec2", "rec3"]
}}

KPI Rules:
- Pick the 4-6 most important financial metrics a CEO would want
- Format values nicely: "$1.2M", "$45K", "12.4%", "8.3 months", etc.
- For trend, calculate if possible from the data, otherwise use None
- Intelligently detect: revenue, costs, margins, counts, averages, ratios

Chart Rules:
- Generate exactly 2 charts
- Choose chart types that best fit the data:
  - bar: categorical comparisons (spend by category, top items)
  - line: time series or trends
  - pie: proportional breakdowns
- xAxisKey and yAxisKey must be actual keys in the data dicts
- Limit chart data to top 10 items max for readability
- Sort data meaningfully (descending by value, chronological, etc.)

SERIALIZATION — MANDATORY:
- ALL values in result must be JSON-serializable
- Convert numpy scalars: use .item() or float() or int()
- No NaN, no Inf — use fillna(0) or dropna()
- Use round() for decimal values
- Strings for formatted values like "$1.2M"
- None (not np.nan) for missing trends"""


@router.post("/briefing", response_model=BriefingResponse)
async def generate_briefing(request: BriefingRequest):
    """Generate an executive briefing for uploaded files"""
    relevant_files = {}
    for fid in request.file_ids:
        if fid not in uploaded_files:
            raise HTTPException(status_code=404, detail=f"File {fid} not found")
        relevant_files[fid] = uploaded_files[fid]

    generator = BriefingGenerator()
    result = generator.generate(relevant_files)
    return BriefingResponse(**result)


@router.get("/health-score", response_model=HealthScoreResponse)
async def get_health_score():
    """Calculate financial health score across all uploaded files"""
    if not uploaded_files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    calculator = HealthScoreCalculator()
    result = calculator.calculate(uploaded_files)
    return HealthScoreResponse(**result)


@router.post("/suggestions", response_model=SuggestionsResponse)
async def generate_suggestions(request: SuggestionsRequest):
    """Generate smart question suggestions and scenario presets from uploaded data schemas"""
    relevant_files = {}
    for fid in request.file_ids:
        if fid not in uploaded_files:
            raise HTTPException(status_code=404, detail=f"File {fid} not found")
        relevant_files[fid] = uploaded_files[fid]

    schemas_desc = []
    for fid, fdata in relevant_files.items():
        schema = fdata["schema"]
        col_parts = []
        for c in schema.columns:
            desc = f"{c.name} ({c.dtype})"
            if c.sample_values:
                desc += f" samples={c.sample_values[:3]}"
            if c.min_value is not None:
                desc += f" range=[{c.min_value}..{c.max_value}]"
            col_parts.append(desc)
        cols = "\n    ".join(col_parts)
        schemas_desc.append(f'File "{fdata["filename"]}" ({schema.row_count} rows):\n    {cols}')

    schemas_text = "\n".join(schemas_desc)

    context_block = ""
    if request.last_question and request.last_answer:
        context_block = f"""
The user just asked: "{request.last_question}"
And the system answered: "{request.last_answer[:300]}"

Generate FOLLOW-UP questions that explore different angles of the data, not the same topic."""

    prompt = f"""Here are the EXACT schemas of the uploaded datasets:
{schemas_text}
{context_block}

CRITICAL: You must ONLY reference columns and concepts that ACTUALLY EXIST in the schemas above.
Do NOT invent or assume columns like "revenue", "customers", "headcount" unless they appear in the schema.
Read the column names carefully — this could be inventory data, sales data, HR data, or anything.

Generate:
1. "questions": 4 smart analytical questions answerable using ONLY the columns listed above. Reference actual column names from the schema. For example, if the data has "Stock_Level" and "Reorder_Level", ask about stock analysis — NOT about "customer churn" or "revenue trends" that don't exist.
2. "scenarios": 5 what-if scenario prompts that modify actual numeric columns from the schema. Each scenario must name a real column. For example if there's a "Unit_Cost" column: "What if Unit_Cost increases by 25%?" — NOT "What if revenue drops 20%" when there's no revenue column.

Respond with ONE JSON object, no markdown:
{{"questions": ["q1", "q2", "q3", "q4"], "scenarios": ["s1", "s2", "s3", "s4", "s5"]}}"""

    all_col_names = []
    for fdata in relevant_files.values():
        all_col_names.extend(c.name for c in fdata["schema"].columns)

    generic_questions = [
        "What are the key metrics in my data?",
        "Show me a summary of all columns",
        f"What is the distribution of {all_col_names[0]}?" if all_col_names else "What patterns exist in the data?",
        "Are there any anomalies or outliers?",
    ]
    numeric_cols = [c.name for fdata in relevant_files.values() for c in fdata["schema"].columns if c.dtype in ("int64", "float64", "int32", "float32")]
    generic_scenarios = [
        f"What if {numeric_cols[0]} increases by 25%?" if len(numeric_cols) > 0 else "What if we increase the main metric by 25%?",
        f"What if {numeric_cols[1]} drops by 30%?" if len(numeric_cols) > 1 else "What if we reduce costs by 30%?",
        f"What if {numeric_cols[0]} doubles?" if len(numeric_cols) > 0 else "What if we double the primary value?",
        f"What if we remove all rows where {numeric_cols[-1]} is below average?" if len(numeric_cols) > 0 else "What if we remove underperformers?",
        f"What if {numeric_cols[min(2, len(numeric_cols)-1)]} is cut by half?" if len(numeric_cols) > 0 else "What if values are halved?",
    ]

    bedrock = get_bedrock_client()
    if not bedrock.is_configured():
        return SuggestionsResponse(questions=generic_questions, scenarios=generic_scenarios)

    try:
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "temperature": 0.7,
            "system": "You are a financial data analyst. Respond with ONLY a valid JSON object. No markdown, no code fences.",
            "messages": [{"role": "user", "content": prompt}],
        }
        response = bedrock.client.invoke_model(
            modelId=bedrock.model_id,
            body=json.dumps(request_body),
        )
        response_body = json.loads(response["body"].read())
        generated_text = response_body["content"][0]["text"]
        result = bedrock._extract_json(generated_text)

        questions = result.get("questions", [])[:4]
        scenarios = result.get("scenarios", [])[:5]

        if len(questions) < 2:
            questions = generic_questions
        if len(scenarios) < 2:
            scenarios = generic_scenarios

        return SuggestionsResponse(questions=questions, scenarios=scenarios)

    except Exception as e:
        logger.exception("Suggestions generation failed")
        return SuggestionsResponse(questions=generic_questions, scenarios=generic_scenarios)


@router.post("/scenario", response_model=ScenarioResponse)
async def run_scenario(request: ScenarioRequest):
    """Run a what-if scenario using AI"""
    if request.file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found")

    file_data = uploaded_files[request.file_id]
    df = file_data["dataframe"]
    schema = file_data["schema"]

    schema_dict = {
        "columns": [
            {"name": c.name, "dtype": c.dtype, "sample_values": c.sample_values}
            for c in schema.columns
        ],
        "row_count": schema.row_count,
    }

    bedrock = get_bedrock_client()
    if not bedrock.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")

    scenario_prompt = _build_scenario_prompt(schema_dict, request.scenario)

    try:
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.0,
            "system": _build_scenario_system_prompt(),
            "messages": [{"role": "user", "content": scenario_prompt}],
        }

        response = bedrock.client.invoke_model(
            modelId=bedrock.model_id,
            body=json.dumps(request_body),
        )
        response_body = json.loads(response["body"].read())
        generated_text = response_body["content"][0]["text"]

        parsed = _extract_scenario_tags(generated_text)

        if not parsed["original_code"] and not parsed["scenario_code"]:
            logger.error("LLM returned no usable code tags. Raw: %s", generated_text[:500])
            return ScenarioResponse(
                scenario=request.scenario,
                original_metrics={},
                projected_metrics={},
                impact_summary=parsed["impact_summary"] or "The AI was unable to generate a structured scenario analysis for this request. Try rephrasing your what-if scenario.",
                artifact_html=None,
            )

        original_metrics = {}
        projected_metrics = {}

        executor = SecureCodeExecutor()

        if parsed["original_code"]:
            try:
                orig_result = executor.execute(parsed["original_code"], df)
                if orig_result.get("error"):
                    logger.warning("Scenario original_code error: %s", orig_result["error"])
                elif orig_result.get("result"):
                    original_metrics = _safe_metrics(orig_result["result"])
            except Exception as exec_err:
                logger.warning("Scenario original_code exception: %s", str(exec_err))

        if parsed["scenario_code"]:
            try:
                scenario_result = executor.execute(parsed["scenario_code"], df)
                if scenario_result.get("error"):
                    logger.warning("Scenario scenario_code error: %s", scenario_result["error"])
                elif scenario_result.get("result"):
                    projected_metrics = _safe_metrics(scenario_result["result"])
            except Exception as exec_err:
                logger.warning("Scenario scenario_code exception: %s", str(exec_err))

        artifact_html = parsed["artifact_html"]
        if artifact_html:
            import math
            import numpy as np
            import pandas as pd

            def _safe_json_dumps(obj):
                class Enc(json.JSONEncoder):
                    def default(self, o):
                        if isinstance(o, pd.Timestamp):
                            return o.isoformat()
                        if isinstance(o, (np.integer,)):
                            return int(o)
                        if isinstance(o, (np.floating,)):
                            v = float(o)
                            return None if (math.isnan(v) or math.isinf(v)) else v
                        if isinstance(o, np.ndarray):
                            return o.tolist()
                        if isinstance(o, (np.bool_,)):
                            return bool(o)
                        return str(o)
                return json.dumps(obj, cls=Enc, default=str)

            if "ORIGINAL_DATA" in artifact_html:
                artifact_html = artifact_html.replace("ORIGINAL_DATA", _safe_json_dumps(original_metrics))
            if "SCENARIO_DATA" in artifact_html:
                artifact_html = artifact_html.replace("SCENARIO_DATA", _safe_json_dumps(projected_metrics))

        return ScenarioResponse(
            scenario=request.scenario,
            original_metrics=original_metrics,
            projected_metrics=projected_metrics,
            impact_summary=parsed["impact_summary"] or "Scenario analysis complete.",
            artifact_html=artifact_html,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Scenario analysis failed")
        raise HTTPException(status_code=500, detail=f"Scenario analysis failed: {str(e)}")


def _extract_scenario_tags(text: str) -> dict:
    """Extract scenario fields from XML-style tags in LLM response.

    Immune to the JSON-escaping problem because HTML content lives
    between tags rather than inside a JSON string value.
    """
    def _get_tag(tag: str) -> str:
        match = re.search(rf"<{tag}>(.*?)</{tag}>", text, re.DOTALL)
        return match.group(1).strip() if match else ""

    return {
        "original_code": _get_tag("original_code"),
        "scenario_code": _get_tag("scenario_code"),
        "impact_summary": _get_tag("impact_summary"),
        "artifact_html": _get_tag("artifact_html"),
    }


def _safe_metrics(result) -> dict:
    import math
    import numpy as np
    import pandas as pd
    if isinstance(result, dict):
        clean = {}
        for k, v in result.items():
            try:
                if isinstance(v, pd.Timestamp):
                    clean[str(k)] = v.isoformat()
                elif isinstance(v, (np.integer,)):
                    clean[str(k)] = int(v)
                elif isinstance(v, (np.floating,)):
                    fv = float(v)
                    clean[str(k)] = 0 if (math.isnan(fv) or math.isinf(fv)) else fv
                elif isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                    clean[str(k)] = 0
                else:
                    clean[str(k)] = v
            except (TypeError, ValueError):
                clean[str(k)] = str(v)
        return clean
    return {"value": str(result)}


def _build_scenario_system_prompt() -> str:
    return """You are a scenario analyst. Given a DataFrame schema and a what-if scenario, generate Python code to:
1. Calculate original baseline metrics from the data
2. Calculate projected metrics after applying the scenario

═══════════════════════════════════════
OUTPUT FORMAT — XML TAGS (NOT JSON)
═══════════════════════════════════════

You MUST respond using these four XML tags. Do NOT use JSON. Do NOT wrap in code fences.
Put each section inside its own tag exactly as shown:

<original_code>
# Python pandas code that computes:
# result = {'metric_name': numeric_value, ...}
# from the original df
</original_code>

<scenario_code>
# Python pandas code that applies the scenario and computes:
# result = {'metric_name': numeric_value, ...}
# Use df_scenario = df.copy() to avoid mutating the original
</scenario_code>

<impact_summary>
2-3 sentence plain English summary of the scenario's impact.
</impact_summary>

<artifact_html>
Complete self-contained HTML page comparing original vs scenario with charts.
Use ORIGINAL_DATA and SCENARIO_DATA as JavaScript variable placeholders — the backend will replace them with real JSON.
Use Chart.js CDN: https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
Dark theme: background #0d1117, surface #161b22, accent #3b82f6, text #e6edf3, muted #8b949e
</artifact_html>

═══════════════════════════════════════
ABSOLUTE RULES — VIOLATION = CRASH
═══════════════════════════════════════
1. `df` is ALREADY LOADED — DO NOT use pd.read_csv() or any file reading
2. ONLY use column names from the schema. If the user mentions a column that does NOT exist, map to the CLOSEST available column:
   - User says "revenue" but schema has "Sales_Amount" → use "Sales_Amount"
   - User says "costs" but schema has "Unit_Cost" → use "Unit_Cost"
   - User says "headcount" but schema has "Stock_Level" → reinterpret as stock quantity
3. NEVER reference a column name not in the schema
4. result must be a dict with string keys and numeric values
5. No imports needed (pandas as pd, numpy as np, datetime available)
6. Round all values to 2 decimal places
7. Use float() or int() to convert numpy types
8. Handle NaN with fillna(0) or dropna()
9. Make a copy for scenario: df_scenario = df.copy()
10. If a scenario doesn't map cleanly, pick the most relevant numeric columns and apply the percentage change"""


def _build_scenario_prompt(schema: dict, scenario: str) -> str:
    columns_info = []
    numeric_cols = []
    for col in schema.get("columns", []):
        line = f"  - {col['name']}: {col['dtype']}"
        if col.get('sample_values'):
            line += f" (samples: {col['sample_values'][:3]})"
        columns_info.append(line)
        if col['dtype'] in ('int64', 'float64', 'int32', 'float32'):
            numeric_cols.append(col['name'])

    col_names_list = [col['name'] for col in schema.get("columns", [])]

    return f"""══════════════════════════════════════
AVAILABLE COLUMNS IN `df` (use ONLY these):
══════════════════════════════════════
{chr(10).join(columns_info)}

Column names (copy-paste these): {col_names_list}
Numeric columns you can do math on: {numeric_cols}
Total Rows: {schema.get('row_count', 0)}

══════════════════════════════════════
WHAT-IF SCENARIO: {scenario}
══════════════════════════════════════

Respond with four XML tags: <original_code>, <scenario_code>, <impact_summary>, <artifact_html>.
Your code must ONLY use column names from: {col_names_list}
If the scenario mentions columns not in this list, map to the closest available column."""
