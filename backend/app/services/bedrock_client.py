"""
AWS Bedrock client for Claude API integration
Handles communication with Claude models via AWS Bedrock
"""
import os
import json
import boto3
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()


class BedrockClient:
    """Client for AWS Bedrock Claude API"""

    def __init__(self):
        """Initialize Bedrock client with AWS credentials"""
        self.aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.aws_session_token = os.getenv("AWS_SESSION_TOKEN")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-5-20250929-v1:0")

        # Initialize boto3 client
        self._init_client()

    def _init_client(self):
        """Initialize the Bedrock runtime client"""
        session_params = {
            "region_name": self.aws_region
        }

        # Add credentials if provided
        if self.aws_access_key_id and self.aws_secret_access_key:
            session_params["aws_access_key_id"] = self.aws_access_key_id
            session_params["aws_secret_access_key"] = self.aws_secret_access_key

            # Session token is optional (for temporary credentials)
            if self.aws_session_token:
                session_params["aws_session_token"] = self.aws_session_token

        session = boto3.Session(**session_params)
        self.client = session.client("bedrock-runtime")

    def is_configured(self) -> bool:
        """Check if AWS credentials are configured"""
        return bool(
            self.aws_access_key_id and
            self.aws_secret_access_key
        )

    def generate_query_response(
        self,
        schema: Dict[str, Any],
        query: str,
        max_tokens: int = 4096,
        temperature: float = 0.0
    ) -> Dict[str, Any]:
        """
        Generate BI query response with JSON format

        Args:
            schema: DataFrame schema information
            query: User's natural language query
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0 = deterministic)

        Returns:
            JSON response dict with output_type, render_mode, aggregation_code, artifact, etc.
        """
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(schema, query)

        # Bedrock API request format for Claude
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        }

        try:
            # Call Bedrock
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )

            # Parse response
            response_body = json.loads(response["body"].read())

            # Extract JSON response
            if "content" in response_body and len(response_body["content"]) > 0:
                generated_text = response_body["content"][0]["text"]
                return self._extract_json(generated_text)

            raise Exception("No content in response")

        except Exception as e:
            raise Exception(f"Bedrock API error: {str(e)}")

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON object from Claude response"""
        text = text.strip()

        # Try to parse as JSON directly
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to extract JSON from markdown code blocks
        if "```json" in text:
            start = text.index("```json") + len("```json")
            end = text.index("```", start)
            json_str = text[start:end].strip()
            return json.loads(json_str)

        # Try generic code blocks
        if "```" in text:
            start = text.index("```") + 3
            end = text.index("```", start)
            json_str = text[start:end].strip()
            return json.loads(json_str)

        # Last resort: try to find JSON object
        start_idx = text.find("{")
        end_idx = text.rfind("}") + 1
        if start_idx >= 0 and end_idx > start_idx:
            json_str = text[start_idx:end_idx]
            return json.loads(json_str)

        raise ValueError(f"Could not extract valid JSON from response: {text[:200]}")

    def _build_system_prompt(self) -> str:
        """Build system prompt for code generation matching BI tool reference"""
        return """You are an expert Business Intelligence analyst with deep knowledge of pandas and data visualization.

════════════════════════════════════════════════════════
OUTPUT FORMAT — MANDATORY
════════════════════════════════════════════════════════
Your ENTIRE response must be ONE valid JSON object.
- No text before or after the JSON
- No markdown, no code fences, no explanations
- All JSON values must be JSON literals (strings, numbers, booleans, null, arrays, objects)
- Python code lives ONLY inside the "aggregation_code" string — nowhere else
- NEVER put Python expressions or variable names as JSON values

FORBIDDEN (breaks the system):
  {"total": round(total_revenue, 2)}   ← Python expression as a JSON value

CORRECT:
  {"aggregation_code": "result = df['revenue'].sum()"}   ← Python as a string value

════════════════════════════════════════════════════════
JSON SCHEMA
════════════════════════════════════════════════════════
{
  "output_type": "metric | text | table | chart | dashboard | followup",
  "render_mode": "chat | artifact",
  "aggregation_code": "<python string> | null",
  "chat_message": "<plain English — 1-3 sentences>",
  "artifact": { "type": "html", "content": "<complete HTML string>" } | null,
  "insight": "<exactly 2 sentences>",
  "sources": [
    { "dataframe": "<df_name>", "columns_used": ["<col1>", "<col2>"] }
  ]
}

════════════════════════════════════════════════════════
DECISION RULES
════════════════════════════════════════════════════════

1. output_type
   metric     → single computed number (sum, count, average, %)
   text       → qualitative answer, no computation needed
   table      → top-N list, multi-row result
   chart      → one visualisation
   dashboard  → multiple KPI cards + charts combined
   followup   → query is ambiguous, ask for clarification

2. render_mode
   chat     → metrics, short text, tables < 5 rows
   artifact → charts, dashboards, tables ≥ 5 rows, formatted reports

3. aggregation_code
   - Write pandas code when data computation is required
   - Code MUST assign final result to a variable named `result`
   - For metrics:    result = df['col'].sum()
   - For tables:     result = df.groupby('a')['b'].sum().reset_index()
   - For charts:     result = df.groupby('a')['b'].sum().reset_index().to_dict(orient='records')
   - Set null if no computation needed (pure text answers)
   - NO import statements - pandas, numpy, datetime already available

4. chat_message for metrics
   - Use "RESULT_VALUE" as a placeholder — the backend will replace it with the real computed value
   - Example: "The total revenue is RESULT_VALUE."
   - Example: "There are RESULT_VALUE unique products in the dataset."

5. artifact HTML (when render_mode = "artifact")
   - Complete self-contained HTML — no external data fetches
   - IMPORTANT: To use real Python-calculated data in the HTML chart, use the literal string `RESULT_DATA` as a placeholder in your JavaScript.
   - Example: `const data = RESULT_DATA;`
   - The backend will magically string-replace `RESULT_DATA` with the JSON array/dict from your Python `result` variable before sending it to the user.
   - Do NOT hardcode hallucinated or fake data in the HTML! Always use `RESULT_DATA`.
   - CDN: https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
   - Fonts: https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap
   - Color palette:
       background  #0a0b0f   surface  #111318   accent   #e8ff47
       text        #f0f2f8   muted    #7a8099   border   #1f2937
   - Fonts: headings → Bebas Neue, body → DM Sans, numbers → DM Mono
   - Charts: maintainAspectRatio: false, container height in CSS
   - Style: border-radius 12px, box-shadow, hover effects
   - Dashboards: CSS grid, metric KPI cards on top row, charts below

6. insight
   - Exactly 2 sentences
   - Sentence 1: what the data shows
   - Sentence 2: actionable business recommendation

7. sources
   - List every DataFrame you read or computed from
   - For each, list only the column names you actually referenced in aggregation_code or used to answer the question
   - If no computation was needed, list the DataFrames that were relevant to the answer
   - Example: [{"dataframe": "df", "columns_used": ["revenue", "region"]}]

════════════════════════════════════════════════════════
EXAMPLE OUTPUTS
════════════════════════════════════════════════════════

METRIC:
{
  "output_type": "metric",
  "render_mode": "chat",
  "aggregation_code": "result = float(df['revenue'].sum())",
  "chat_message": "The total revenue is RESULT_VALUE.",
  "artifact": null,
  "insight": "Total revenue is the primary business health indicator. Tracking monthly trends against this baseline will highlight growth or decline early.",
  "sources": [{"dataframe": "df", "columns_used": ["revenue"]}]
}

CHART:
{
  "output_type": "chart",
  "render_mode": "artifact",
  "aggregation_code": "result = df.groupby('category')['amount'].sum().sort_values(ascending=False).reset_index().to_dict(orient='records')",
  "chat_message": "Here is a bar chart showing amounts by category.",
  "artifact": {
    "type": "html",
    "content": "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>Chart</title><link href='https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap' rel='stylesheet'><script src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'></script><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0b0f;color:#f0f2f8;font-family:'DM Sans',sans-serif;padding:24px}.card{background:#111318;border-radius:12px;padding:24px;box-shadow:0 4px 24px rgba(0,0,0,.4)}.title{font-family:'Bebas Neue',sans-serif;font-size:28px;color:#e8ff47;margin-bottom:16px}.chart-wrap{position:relative;height:380px}</style></head><body><div class='card'><div class='title'>Amount by Category</div><div class='chart-wrap'><canvas id='c'></canvas></div></div><script>const d=RESULT_DATA;new Chart(document.getElementById('c'),{type:'bar',data:{labels:d.map(x=>x.category),datasets:[{data:d.map(x=>x.amount),backgroundColor:'#e8ff47',borderRadius:6,hoverBackgroundColor:'#f5ff8a'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'#1f2937'},ticks:{color:'#7a8099'}},x:{grid:{display:false},ticks:{color:'#7a8099'}}}}})</script></body></html>"
  },
  "insight": "Category distribution reveals revenue concentration. Focus marketing efforts on underperforming categories to balance revenue streams.",
  "sources": [{"dataframe": "df", "columns_used": ["category", "amount"]}]
}"""

    def _build_user_prompt(self, schema: Dict[str, Any], query: str) -> str:
        """Build user prompt with schema and query"""
        columns_info = "\n".join([
            f"  - {col['name']}: {col['dtype']} (sample: {col.get('sample_values', [])})"
            for col in schema.get("columns", [])
        ])

        return f"""DataFrame Schema:
{columns_info}

Total Rows: {schema.get('row_count', 0)}

User Query: {query}

Generate Python code using the 'df' variable to answer this query.

IMPORTANT FOR VISUALIZATION:
If the user asks for a chart, graph, visualization, or "show me", create a variable called RESULT_DATA with chart data:

```python
# For bar/line charts:
RESULT_DATA = {{
    "type": "bar",  # or "line"
    "data": [
        {{"name": "Category1", "value": 123}},
        {{"name": "Category2", "value": 456}},
    ]
}}

# For pie charts:
RESULT_DATA = {{
    "type": "pie",
    "data": [
        {{"name": "Slice1", "value": 30}},
        {{"name": "Slice2", "value": 70}},
    ]
}}
```

Remember: Only use columns from the schema above."""

    def _extract_code(self, text: str) -> str:
        """Extract code from markdown code blocks"""
        # Look for ```python code blocks
        if "```python" in text:
            start = text.index("```python") + len("```python")
            end = text.index("```", start)
            return text[start:end].strip()

        # Look for generic ``` code blocks
        elif "```" in text:
            start = text.index("```") + 3
            end = text.index("```", start)
            return text[start:end].strip()

        # Return as-is if no code blocks
        return text.strip()

    def chat(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> str:
        """
        General chat interface for conversational queries

        Args:
            messages: List of message dicts with 'role' and 'content'
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature

        Returns:
            Assistant's response as string
        """
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages
        }

        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )

            response_body = json.loads(response["body"].read())

            if "content" in response_body and len(response_body["content"]) > 0:
                return response_body["content"][0]["text"]

            raise Exception("No content in response")

        except Exception as e:
            raise Exception(f"Bedrock API error: {str(e)}")


# Singleton instance
_bedrock_client: Optional[BedrockClient] = None


def get_bedrock_client() -> BedrockClient:
    """Get or create BedrockClient singleton"""
    global _bedrock_client
    if _bedrock_client is None:
        _bedrock_client = BedrockClient()
    return _bedrock_client
