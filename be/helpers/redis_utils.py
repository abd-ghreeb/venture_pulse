import redis
import secrets
from config.config import Settings
from typing import Any, Dict
import json
from helpers.json_utils import json_serial
from helpers.logging import setup_logger

logger = setup_logger("redis_utils.py")

# Redis configuration
redis_client = redis.Redis(host=Settings.REDIS_HOST, port=Settings.REDIS_PORT, decode_responses=True)

# SSE broadcaster
REDIS_URL = f"redis://{Settings.REDIS_HOST}:{Settings.REDIS_PORT}"


def set_redis(key, value, ttl):
    """Set a cache value with a time-to-live (TTL)."""
    redis_client.setex(key, ttl, value)

def get_redis(key):
    """Retrieve a value from the cache."""
    return redis_client.get(key)

def delete_redis(key):
    redis_client.delete(key)

def getdel_redis(key):
    """Atomic Fetch and Delete from Redis"""
    return redis_client.getdel(key)

def delete_redis_pattern(key_pattern):
    # Match keys with a pattern
    keys = redis_client.keys(key_pattern)  # Replace 'pattern:*' with your desired pattern

    # Delete the keys
    if keys:
        redis_client.delete(*keys)  # Use unpacking to pass the keys list to delete
    return keys

def flush_redis():
    """Flush all data from the current database."""
    redis_client.flushdb()
    
# --- Session utils ---
SESSION_STORE = {}

def get_user_session(session_id: str):
    if redis_client:
        try:
            state = redis_client.get(session_id)
            return json.loads(state) if state else {}
        except Exception as e:
            logger.error(f"get_user_session error: {e}")

    return SESSION_STORE.get(session_id, {})

def reset_user_session(session_id: str="test"):
    if redis_client:
        try:
            delete_redis(session_id)
        except Exception as e:
            logger.error(f"failed to reset redis session error: {e}")

    SESSION_STORE[session_id] = {}
    return "success"

def save_user_session(session_id: str, state: dict, expire_seconds: int = 86400):
    """ default ttl is one day """
    if redis_client:
        redis_client.setex(
            name=session_id, 
            time=expire_seconds, 
            value=json.dumps(state, default=json_serial, ensure_ascii=False))
    else:
        SESSION_STORE[session_id] = state
