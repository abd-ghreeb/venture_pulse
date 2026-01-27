from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError

from config.content import ERROR_MESSAGES
from helpers.logging import setup_logger

logger = setup_logger("ExceptionHandler")


class QuotaExceededException(Exception):
    pass


class ExceptionHandler:

    @staticmethod
    def get_lang(request: Request) -> str:
        return request.headers.get("Accept-Language", "en")

    @staticmethod
    def get_error_msg(code: str, lang: str) -> str:
        return ERROR_MESSAGES.get(code, {}).get(lang, "An error occurred.")

    @staticmethod
    async def http_exception_handler(request: Request, exc: HTTPException):
        lang = ExceptionHandler.get_lang(request)
        logger.warning(f"[HTTPException] {exc.detail} | Path: {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail, "lang": lang}
        )

    @staticmethod
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
        lang = ExceptionHandler.get_lang(request)
        logger.warning(f"[StarletteHTTPException] {exc.detail} | Path: {request.url}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail, "lang": lang}
        )

    @staticmethod
    async def validation_exception_handler(request: Request, exc: (ValidationError, RequestValidationError)):
        lang = ExceptionHandler.get_lang(request)
        logger.warning(f"[ValidationError] {exc.errors()} | Path: {request.url}")
        return JSONResponse(
            status_code=422,
            content={
                "error": ExceptionHandler.get_error_msg("invalid_request", lang),
                "details": exc.errors(),
                "lang": lang
            }
        )


    @staticmethod
    async def universal_exception_handler(request: Request, exc: Exception):
        lang = ExceptionHandler.get_lang(request)

        if isinstance(exc, QuotaExceededException):
            logger.error(f"[QuotaExceeded] User exceeded quota | Path: {request.url}")
            return JSONResponse(
                status_code=429,
                content={"error": ExceptionHandler.get_error_msg("quota_exceeded", lang), "lang": lang}
            )

        # fallback error
        logger.exception(f"[UnhandledError] {str(exc)} | Path: {request.url}")
        return JSONResponse(
            status_code=500,
            content={
                "error": ExceptionHandler.get_error_msg("internal_error", lang),
                "lang": lang
            }
        )
