from fastapi import Depends, HTTPException, Request, status, Header, Cookie
import json
from models.user import User
from sqlmodel import Session, select
import requests
from typing import Dict, Any, Optional
from config.config import Settings
from helpers.redis_utils import get_redis, set_redis
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from helpers.redis_utils import redis_client
from models.db import get_session
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from helpers.logging import setup_logger

logger = setup_logger("authenticating utils")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") # good for Swagger docs, not strictly needed for direct token parsing though
ACCESS_TOKEN_PREFIX = "onboarding:token:"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, Settings.SECRET_KEY, algorithm=Settings.ALGORITHM)
    return encoded_jwt

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def get_current_user(
        authToken: str = Cookie(None), 
        session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if authToken is None:
        logger.error("No authToken found")
        raise credentials_exception
    try:
        payload = jwt.decode(authToken, Settings.SECRET_KEY, algorithms=[Settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.error("get_current_user failed. Invalid Token; no user_id found in payload")
            raise credentials_exception
        # --- Query database for user ---
        user = session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            logger.error(f"User {user_id} not found in DB")
            raise credentials_exception

        return user        
    except JWTError:
        logger.error("JWTError")
        raise credentials_exception
