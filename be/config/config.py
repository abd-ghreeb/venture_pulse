import os
from dotenv import load_dotenv
# Try to load .env
ENV_PATH = os.getenv("APP_ENV_FILE", ".env")
load_dotenv(dotenv_path=ENV_PATH)

USE_VAULT = os.getenv("USE_VAULT", "false").lower() == "true"

# Stub function – replace with real vault integration
def load_from_vault(secret_key: str) -> str:
    # Example: return get_secret(secret_key) from AWS or HashiCorp Vault
    secrets = {
        "OPENAI_API_KEY": "vault-fake-openai-key",
        "REDIS_URL": "redis://vault-redis:6379/0",
    }
    return secrets.get(secret_key)


def get_config(key: str, default=None):
    """Get config from env or vault depending on USE_VAULT flag."""
    if USE_VAULT:
        return load_from_vault(key) or default
    return os.getenv(key, default)


# Load all required config vars here
class Settings:
    # Auth
    SECRET_KEY = get_config("JWT_SECRET_KEY")
    ALGORITHM = get_config("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(get_config("ACCESS_TOKEN_EXPIRE_MINUTES", 60000)) # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS = int(get_config("REFRESH_TOKEN_EXPIRE_DAYS", 14))

    # General
    ENV = get_config("ENV", "development")
    DEBUG = get_config("DEBUG", "false").lower() == "true"

    # LLMs
    OPENAI_API_KEY = get_config("OPENAI_API_KEY")
    
    # Redis
    REDIS_HOST = get_config("REDIS_HOST", "redis")
    REDIS_PORT = get_config("REDIS_PORT", "6379")
    REDIS_URL = get_config("REDIS_URL", "redis://redis:6379")

    # DB service
    DB_USER = get_config("DB_USER", "postgres")
    DB_PASSWORD = get_config("DB_PASS", "postgres123")
    DB_NAME = get_config("DB_NAME", "venture_pulse")

settings = Settings()

def get_user_profile(userId):
    return {"username": "test user",
            "userid": userId}