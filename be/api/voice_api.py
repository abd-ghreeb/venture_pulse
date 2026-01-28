import os
from fastapi import APIRouter, FastAPI, UploadFile, File
from openai import OpenAI
from config.config import Settings

router = APIRouter()
# 2. Instantiate the client (it will look for OPENAI_API_KEY in your env)
client = OpenAI(api_key=Settings.OPENAI_API_KEY | os.getenv("OPENAI_API_KEY"))

def voice_api(app: FastAPI, prefix: str = "/api/v1"):

    @app.post(f"{prefix}/voice-query")
    async def voice_query(file: UploadFile = File(...)):
        # Save the incoming mobile audio to a temporary file
        temp_filename = "temp_audio.m4a"
        with open(temp_filename, "wb") as buffer:
            buffer.write(await file.read())
        
        try:
            # 3. Use the new client-based transcription syntax
            with open(temp_filename, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file
                )
            
            # In v1+, 'transcript' is an object, access text via .text attribute
            return {"text": transcript.text}
        
        finally:
            # Clean up the file after processing
            if os.path.exists(temp_filename):
                os.remove(temp_filename)    