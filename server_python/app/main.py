"""
FIFA World Cup 2026 Stadium Operations API

FastAPI server providing AI-powered guidance for venue management, accessibility,
transit optimization, and sustainability initiatives.

Endpoints:
- POST /v1/assistant: Get stadium operations guidance

Configuration:
- CORS is configured for local development (http://localhost:5173)
- In production, restrict CORS origins to your domain
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from .schemas import AssistantRequest, AssistantResponse
from .assistant import get_assistant_reply

logger = logging.getLogger(__name__)

app = FastAPI(
    title="StadiumMate Assistant API",
    version="1.0.0",
    description="AI-powered stadium operations guidance system for FIFA World Cup 2026"
)

# CORS configuration for development
# In production, restrict origins to your deployment domain
# Examples:
#   - Vercel: https://your-app.vercel.app
#   - Custom domain: https://yourdomain.com
#   - Multiple origins: ["https://vercel.app", "https://yourdomain.com"]

# Get allowed origins from environment or use defaults
import os
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post(
    "/v1/assistant",
    response_model=AssistantResponse,
    summary="Get AI stadium operations guidance",
    tags=["Assistant"]
)
@app.post(
    "/api/assistant",
    response_model=AssistantResponse,
    summary="Compatibility alias for frontend deployment",
    tags=["Assistant"]
)
async def assistant(req: AssistantRequest) -> AssistantResponse:
    """
    Process user query and return AI-generated stadium operations guidance
    
    This endpoint:
    1. Validates the user prompt (must be a string, max 1000 chars)
    2. Calls the deterministic rules engine + optional Gemini API
    3. Returns venue-aware recommendations for crowd, accessibility, transit, or sustainability
    
    Args:
        req: Request with prompt and optional imageUrl
    
    Returns:
        AssistantResponse with reply text and source ('rules' or 'gemini')
    
    Raises:
        HTTPException 400: If prompt is not a string
        HTTPException 413: If prompt exceeds maximum length
        HTTPException 500: If internal error occurs
    """
    # Validate input type
    if not isinstance(req.prompt, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt must be a string"
        )
    
    # Validate input length
    if len(req.prompt) > 1000:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Prompt too long (maximum 1000 characters)"
        )
    
    # Get assistant reply
    try:
        result = await get_assistant_reply(
            req.prompt,
            getattr(req, 'imageUrl', None)
        )
        return AssistantResponse(
            reply=result.get('reply'),
            source=result.get('source')
        )
    except Exception as e:
        logger.error(f"Assistant error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate guidance. Please try again."
        )


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers and monitors"""
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8080,
        reload=False,
        log_level="info"
    )
