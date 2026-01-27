from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from api.query_api import query_api
from api.auth_api import auth_api
from api.stats_api import stats_api
from api.venture_api import venture_api
from helpers.exception_handler import ExceptionHandler
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from models.db import init_db
import os
from config.config import Settings

import logging

logger = logging.getLogger("app")
router = APIRouter()
app = FastAPI(
    title="Venture Pulse API",  # for Swagger
    description="Venture Pulse APIs.",  # Custom description
    version="1.0.0",  
    )

origins = [
    "https://vp.rutayba.com", # production frontend
    "http://vp.rutayba.com",   # Production HTTP (if not forced to HTTPS)
    "http://localhost:8081",   # local frontend
    "http://127.0.0.1:8081",   # sometimes dev uses this
    "http://localhost:8880",   # local backend itself
    "http://127.0.0.1:8880",   # local backend itself
]

# Add CORS middleware to allow specified origins to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Allow all origins (will be overridden in custom middleware)
    allow_credentials=True,         # Allow credentials (e.g., cookies, authorization headers)
    allow_methods=["*"],            # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],            # Allow all headers
)

# Register routes
query_api(app)
auth_api(app)
venture_api(app)
stats_api(app)


# Register exception handlers
app.add_exception_handler(HTTPException, ExceptionHandler.http_exception_handler)
app.add_exception_handler(StarletteHTTPException, ExceptionHandler.starlette_http_exception_handler)
app.add_exception_handler(RequestValidationError, ExceptionHandler.validation_exception_handler)
app.add_exception_handler(Exception, ExceptionHandler.universal_exception_handler)

# Get environment (default to ENV from Vault if not set)
environment = os.getenv("ENV", Settings.ENV)

@app.get("/", tags=["HealthCheck"])
def health_check():
    return {
        "status": "ok",
        "env": environment,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
    }

@app.on_event('startup')
async def startup():
    init_db()

@app.on_event("shutdown")
async def shutdown():
    pass

app.include_router(router)

