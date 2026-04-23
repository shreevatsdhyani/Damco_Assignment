"""
Text-to-speech endpoints using edge-tts
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import TTSRequest
from app.services.tts_service import TTSService
import io

router = APIRouter()

@router.post("/synthesize")
async def synthesize_speech(request: TTSRequest):
    """
    Convert text to speech using edge-tts
    Returns audio stream
    """
    try:
        tts_service = TTSService()
        audio_data = await tts_service.synthesize(request.text, request.voice)

        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"TTS synthesis failed: {str(e)}"
        )

@router.get("/voices")
async def list_voices():
    """List available TTS voices"""
    return {
        "voices": [
            {"id": "en-US-AriaNeural", "name": "Aria (US English)", "gender": "Female"},
            {"id": "en-US-GuyNeural", "name": "Guy (US English)", "gender": "Male"},
            {"id": "en-GB-SoniaNeural", "name": "Sonia (UK English)", "gender": "Female"},
            {"id": "en-GB-RyanNeural", "name": "Ryan (UK English)", "gender": "Male"},
        ]
    }
