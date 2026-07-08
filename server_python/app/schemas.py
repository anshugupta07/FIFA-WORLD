"""
Pydantic models for stadium operations assistant API

Defines request/response schemas with validation for the /v1/assistant endpoint.
"""

from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Optional


class AssistantRequest(BaseModel):
    """
    Request schema for stadium operations guidance
    
    Attributes:
        prompt: User query for venue management advice (required, max 1000 chars)
        imageUrl: Optional image URL (http/https) for context (max 1024 chars)
    """
    prompt: str = Field(
        ...,
        description="User prompt requesting stadium operations guidance",
        min_length=1,
        max_length=1000
    )
    imageUrl: Optional[str] = Field(
        None,
        description="Optional image URL (http/https) providing context for the request",
        max_length=1024
    )
    
    @field_validator('imageUrl', mode='before')
    @classmethod
    def validate_image_url(cls, v):
        """Validate that imageUrl is either None, empty, or a valid HTTP(S) URL"""
        if not v or v == '':
            return None
        try:
            url = HttpUrl(v)
            return str(url)
        except Exception:
            return None

    class Config:
        """Pydantic model configuration"""
        json_schema_extra = {
            "example": {
                "prompt": "Help a wheelchair user reach the accessible entrance",
                "imageUrl": "https://example.com/stadium-crowd.jpg"
            }
        }


class AssistantResponse(BaseModel):
    """
    Response schema from stadium operations assistant
    
    Attributes:
        reply: Generated guidance text
        source: Origin of the response ('rules' for deterministic, 'gemini' for LLM-phrased)
    """
    reply: str = Field(
        ...,
        description="AI-generated guidance response"
    )
    source: Optional[str] = Field(
        None,
        description="Source of the response: 'rules' (deterministic) or 'gemini' (LLM-phrased)"
    )

    class Config:
        """Pydantic model configuration"""
        json_schema_extra = {
            "example": {
                "reply": "Accessible route recommended: use the east elevators...",
                "source": "rules"
            }
        }
