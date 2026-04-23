"""
Health check endpoints
"""
from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services.bedrock_client import get_bedrock_client
import time
import os

router = APIRouter()

start_time = time.time()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API health status"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        uptime=time.time() - start_time
    )

@router.get("/health/aws")
async def aws_health_check():
    """Check AWS Bedrock configuration status"""
    bedrock = get_bedrock_client()

    has_access_key = bool(os.getenv("AWS_ACCESS_KEY_ID"))
    has_secret_key = bool(os.getenv("AWS_SECRET_ACCESS_KEY"))
    has_session_token = bool(os.getenv("AWS_SESSION_TOKEN"))

    return {
        "status": "configured" if bedrock.is_configured() else "not_configured",
        "aws_region": bedrock.aws_region,
        "model_id": bedrock.model_id,
        "credentials": {
            "access_key_configured": has_access_key,
            "secret_key_configured": has_secret_key,
            "session_token_configured": has_session_token,
        },
        "message": "AWS Bedrock is ready" if bedrock.is_configured() else "AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file."
    }
