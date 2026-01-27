import re, json
import secrets
from cryptography.fernet import Fernet
import base64
import os
import base64

def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()

# Generate a key ONCE and keep it safe (e.g., in environment variable)
# Fernet requires a 32-byte urlsafe base64-encoded key
def get_cipher():
    secret = os.environ.get("ENCRYPTION_SECRET")
    if not secret:
        raise RuntimeError("ENCRYPTION_SECRET is not set")

    # Ensure it's properly padded
    key = base64.urlsafe_b64encode(secret.encode().ljust(32)[:32])
    return Fernet(key)


def encrypt_token(token: str) -> str:
    cipher = get_cipher()
    return cipher.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    cipher = get_cipher()
    return cipher.decrypt(encrypted_token.encode()).decode()


def clean_llm_json(text: str):
    # Remove code fences if present
    cleaned = re.sub(r"^```json\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    return json.loads(cleaned)

def generate_id(lower: bool=False):
    id = secrets.token_urlsafe(16)
    return id.lower() if lower else id
