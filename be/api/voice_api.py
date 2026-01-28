from fastapi import FastAPI, UploadFile, File
import openai
from config.constants import ASR_MODEL

def voice_api(app: FastAPI, prefix: str = "/api/v1"):

    @app.post(f"{prefix}/voice-query")
    async def voice_query(file: UploadFile = File(...)):
        # Save temp file
        with open("temp.m4a", "wb") as buffer:
            buffer.write(await file.read())
        
        # Transcribe using Whisper
        with open("temp.m4a", "rb") as audio_file:
            transcript = openai.Audio.transcribe(ASR_MODEL, audio_file)
        
        return {"text": transcript["text"]}