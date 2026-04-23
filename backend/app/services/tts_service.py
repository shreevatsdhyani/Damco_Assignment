"""
Text-to-speech service using edge-tts
100% free, high-quality TTS with Microsoft Edge voices
"""
import edge_tts
from typing import Optional

class TTSService:
    """Text-to-speech using edge-tts"""

    async def synthesize(
        self,
        text: str,
        voice: str = "en-US-AriaNeural"
    ) -> bytes:
        """
        Convert text to speech audio

        Args:
            text: Text to synthesize
            voice: Voice ID to use

        Returns:
            Audio data as bytes (MP3 format)
        """
        communicate = edge_tts.Communicate(text, voice)

        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]

        return audio_data

    async def get_available_voices(self):
        """Get list of all available voices"""
        voices = await edge_tts.list_voices()
        return voices
