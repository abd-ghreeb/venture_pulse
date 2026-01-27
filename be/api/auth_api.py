import json
from fastapi import FastAPI,HTTPException, status, Depends, Cookie, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from models.refresh_token import RefreshToken
from config.config import Settings
from sqlmodel import Session, select, delete
from models.user import User
from models.db import get_session
from datetime import datetime, timedelta, timezone
import os
from fastapi.responses import JSONResponse, Response # Import Response
from helpers.authentication_utils import create_access_token, get_current_user, hash_password, verify_password
import secrets
from datetime import datetime, timedelta, timezone
from helpers.logging import setup_logger


logger = setup_logger("AuthAPI")

ACCESS_TOKEN_EXPIRE_SEC = Settings.ACCESS_TOKEN_EXPIRE_MINUTES*60
REFRESH_TOKEN_EXPIRE_SEC = Settings.REFRESH_TOKEN_EXPIRE_DAYS*24*60*60

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class MemberInvite(BaseModel):
    email: str
    role: str = "member"

def auth_api(app: FastAPI, prefix: str = "/api/v1/auth"):
    @app.post(f"{prefix}/register", status_code=status.HTTP_201_CREATED)
    async def register_user(user: UserRegister, session: Session = Depends(get_session)):
        # Check if user already exists
        existing_user = session.exec(select(User).where(User.email == user.email)).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        # Create new user
        hashed_password = hash_password(user.password)
        db_user = User(
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            role="admin"
        )
        # 2. Set team_id to match the generated id since this will be the team owner
        db_user.team_id = db_user.id

        session.add(db_user)
        session.commit()
        session.refresh(db_user)

        return {
            "message": "User registered successfully with free 1-week trial",
            "user_id": db_user.id,
            "team_id": db_user.team_id,
            "email": db_user.email
        }

    @app.post(f"{prefix}/login")
    async def login_for_access_token(user_login: UserLogin, session: Session = Depends(get_session)):
        user = session.exec(select(User).where(User.email == user_login.email)).first()
        if not user or not verify_password(plain_password=user_login.password, hashed_password=user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        # refresh token
        refresh_token_value = secrets.token_urlsafe(32)
        refresh_token = RefreshToken(
            user_id=user.id,
            token=refresh_token_value,
            expires_at=datetime.now(timezone.utc) + timedelta(days=Settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        session.add(refresh_token)
        session.commit()
        response = JSONResponse(content={"message": "Login successful"})
        is_prod = os.getenv("ENV") == "production"
        response.set_cookie(
            key="authToken",
            value=access_token,
            httponly=True,
            path="/", # Ensure the cookie is accessible from all paths
            samesite="none" if is_prod else "lax", # Changed to Lax for local dev
            secure=is_prod, # Changed to False for local dev (requires HTTP)
            max_age=ACCESS_TOKEN_EXPIRE_SEC
        )
        response.set_cookie(
            key="refreshToken", 
            value=refresh_token_value, 
            httponly=True, 
            secure=is_prod,
            path="/", 
            samesite="none" if is_prod else "lax",
            max_age=REFRESH_TOKEN_EXPIRE_SEC
        )

        return response

    @app.get(f"{prefix}/me")
    async def read_users_me(
        current_user: dict = Depends(get_current_user), 
        session: Session = Depends(get_session)):
        user_id = current_user.id
        user = session.exec(select(User).where(User.id == str(user_id))).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"user": {"id": str(user.id), "email": user.email, "full_name": user.full_name}}

    @app.post(f"{prefix}/refresh")
    def refresh_token(response: Response, refreshToken: str = Cookie(None), session: Session = Depends(get_session)):
        if not refreshToken:
            raise HTTPException(401, "No refresh token")

        token_entry = session.exec(select(RefreshToken).where(RefreshToken.token == refreshToken)).first()
        if not token_entry or token_entry.expires_at < datetime.now(timezone.utc):
            raise HTTPException(401, "Refresh token expired or invalid")

        # issue new tokens
        access_token = create_access_token({"sub": token_entry.user_id}, timedelta(minutes=Settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        new_refresh_token_value = secrets.token_urlsafe(32)

        # rotate refresh token
        token_entry.token = new_refresh_token_value
        token_entry.expires_at = datetime.now(timezone.utc) + timedelta(days=Settings.REFRESH_TOKEN_EXPIRE_DAYS)
        session.add(token_entry)
        session.commit()

        response.set_cookie(key="authToken", value=access_token, 
                            httponly=True, secure=True, 
                            samesite="Strict", max_age=ACCESS_TOKEN_EXPIRE_SEC)
        response.set_cookie(key="refreshToken", value=new_refresh_token_value, 
                            httponly=True, secure=True, 
                            samesite="Strict", max_age=REFRESH_TOKEN_EXPIRE_SEC)

        return {"message": "Tokens refreshed"}

    @app.post(f"{prefix}/logout")
    def logout(response: Response, 
            refreshToken: str = Cookie(None), 
            session: Session = Depends(get_session)):
        if refreshToken:
            session.exec(delete(RefreshToken).where(RefreshToken.token == refreshToken))
            session.commit()
        response.delete_cookie("authToken")
        response.delete_cookie("refreshToken")
        return {"message": "Logged out"}
