"""
Query execution endpoints
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryRequest, QueryResponse, ChartData
from app.services.code_executor import SecureCodeExecutor
from app.services.bedrock_client import get_bedrock_client
from app.services.tts_service import TTSService
from app.routers.files import uploaded_files
import traceback
import base64
import json
import math
import numpy as np
import pandas as pd


class SafeJSONEncoder(json.JSONEncoder):
    """Handles pandas Timestamps, numpy types, NaN, Inf — anything the sandbox can produce"""
    def default(self, obj):
        if isinstance(obj, pd.Timestamp):
            return obj.isoformat()
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            v = float(obj)
            if math.isnan(v) or math.isinf(v):
                return None
            return v
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.bool_,)):
            return bool(obj)
        if isinstance(obj, pd.Series):
            return obj.tolist()
        if isinstance(obj, pd.DataFrame):
            return obj.to_dict(orient="records")
        if isinstance(obj, (pd.Timedelta, pd.Period)):
            return str(obj)
        if isinstance(obj, set):
            return list(obj)
        return str(obj)


def safe_json_dumps(obj):
    return json.dumps(obj, cls=SafeJSONEncoder, default=str)

router = APIRouter()

@router.post("/execute", response_model=QueryResponse)
async def execute_query(request: QueryRequest):
    """
    Execute a natural language query on financial data

    Flow:
    1. Get file schema (already extracted)
    2. Send schema to AWS Bedrock Claude to generate Pandas code
    3. Execute code in secure sandbox
    4. Return results and optional chart data
    """
    if request.file_id not in uploaded_files:
        raise HTTPException(
            status_code=404,
            detail=f"File not found. Please re-upload your file. Available files: {list(uploaded_files.keys())}"
        )

    file_data = uploaded_files[request.file_id]
    df = file_data["dataframe"]
    schema = file_data["schema"]

    # Get Bedrock client
    bedrock = get_bedrock_client()

    # Check if AWS credentials are configured
    if not bedrock.is_configured():
        raise HTTPException(
            status_code=503,
            detail="AWS Bedrock credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file."
        )

    executor = SecureCodeExecutor()

    try:
        # Generate JSON response using Claude via Bedrock
        schema_dict = schema.dict() if hasattr(schema, 'dict') else schema
        claude_response = bedrock.generate_query_response(
            schema=schema_dict,
            query=request.question
        )

        # Extract fields from JSON response
        aggregation_code = claude_response.get("aggregation_code")
        chat_message = claude_response.get("chat_message", "")
        artifact = claude_response.get("artifact")
        output_type = claude_response.get("output_type", "text")
        render_mode = claude_response.get("render_mode", "chat")

        # Execute aggregation code if present
        execution_result = None
        execution_error = None
        if aggregation_code:
            try:
                execution_result = executor.execute(aggregation_code, df)
                if execution_result.get("error"):
                    execution_error = execution_result["error"]
            except Exception as exec_err:
                execution_error = str(exec_err)

        # Replace RESULT_VALUE in chat_message with actual value
        answer = chat_message
        if execution_result and "RESULT_VALUE" in answer:
            result_value = execution_result.get("result")
            if result_value is not None:
                # Format the value nicely
                if isinstance(result_value, float):
                    formatted_value = f"${result_value:,.2f}" if "revenue" in request.question.lower() or "amount" in request.question.lower() else f"{result_value:,.2f}"
                elif isinstance(result_value, int):
                    formatted_value = f"{result_value:,}"
                else:
                    formatted_value = str(result_value)
                answer = answer.replace("RESULT_VALUE", formatted_value)

        # Replace RESULT_DATA in artifact HTML with actual JSON
        if artifact and isinstance(artifact, dict) and artifact.get("content"):
            html_content = artifact["content"]
            if "RESULT_DATA" in html_content and execution_result and execution_result.get("result"):
                data_json = safe_json_dumps(execution_result["result"])
                # Replace all variations
                html_content = html_content.replace('"RESULT_DATA"', data_json)
                html_content = html_content.replace("'RESULT_DATA'", data_json)
                html_content = html_content.replace("RESULT_DATA", data_json)
                artifact["content"] = html_content

        # Extract chart data for inline rendering (legacy support)
        chart_data = None
        if execution_result and execution_result.get("result"):
            result_data = execution_result["result"]
            if isinstance(result_data, dict) and "type" in result_data and "data" in result_data:
                chart_data = ChartData(
                    type=result_data["type"],
                    data=result_data["data"]
                )

        # Show artifact HTML in answer if render_mode is artifact
        if render_mode == "artifact" and artifact:
            # For now, return both chat message and signal that there's an artifact
            answer = chat_message + "\n\n[Dashboard/Chart rendered below]"

        # Add execution error to answer if present
        if execution_error:
            answer += f"\n\n⚠️ Code execution error: {execution_error}"

        return QueryResponse(
            answer=answer,
            generated_code=aggregation_code or "",
            chart_data=chart_data,
            audio_url=None,  # Will be handled by browser TTS
            artifact_html=artifact.get("content") if artifact else None
        )

    except Exception as e:
        error_detail = f"Query execution failed: {str(e)}"
        print(f"[QUERY ERROR] {error_detail}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )

@router.post("/test")
async def test_query(request: QueryRequest):
    """Test endpoint for query development"""
    return {
        "message": "Query endpoint working",
        "file_id": request.file_id,
        "question": request.question
    }
