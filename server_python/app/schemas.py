from pydantic import BaseModel, Field, HttpUrl
from typing import Optional

class AssistantRequest(BaseModel):
    prompt: str = Field(..., description="User prompt requesting assistance")
    imageUrl: Optional[HttpUrl] = Field(None, description="Optional image URL (http/https)")

class AssistantResponse(BaseModel):
    reply: str
    source: Optional[str] = Field(None, description="Source of truth: 'rules' or 'gemini')")
