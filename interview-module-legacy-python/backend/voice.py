"""
Voice I/O — turn-based (push-to-talk), not continuous streaming.
Candidate records one answer at a time; the avatar speaks one question
at a time. Keeps this feasible to build in days, not weeks.

Setup:
  pip install requests --break-system-packages
  Add DEEPGRAM_API_KEY to backend/.env (free, $200 credit, no card:
  https://console.deepgram.com)
"""

import os
import requests

DEEPGRAM_STT_URL = "https://api.deepgram.com/v1/listen"
DEEPGRAM_TTS_URL = "https://api.deepgram.com/v1/speak?model=aura-asteria-en"


def transcribe_audio(audio_bytes: bytes, mimetype: str = "audio/webm") -> str:
    """One recorded answer in, transcript text out."""
    headers = {
        "Authorization": f"Token {os.environ['DEEPGRAM_API_KEY']}",
        "Content-Type": mimetype,  # browser MediaRecorder typically outputs audio/webm
    }
    resp = requests.post(DEEPGRAM_STT_URL, headers=headers, data=audio_bytes)
    resp.raise_for_status()
    result = resp.json()
    return result["results"]["channels"][0]["alternatives"][0]["transcript"]


def synthesize_speech(text: str) -> bytes:
    """Question text in, playable audio bytes out (mp3)."""
    headers = {
        "Authorization": f"Token {os.environ['DEEPGRAM_API_KEY']}",
        "Content-Type": "application/json",
    }
    resp = requests.post(DEEPGRAM_TTS_URL, headers=headers, json={"text": text})
    resp.raise_for_status()
    return resp.content
