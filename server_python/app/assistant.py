"""
StadiumMate Assistant Module

Implements a deterministic rules-first engine for FIFA World Cup 2026 stadium operations.
- Sanitizes and validates user input
- Matches queries against predefined venue operation scenarios
- Optionally phrases responses using Gemini API when configured
- Falls back to rule-based responses for reliability and low latency
"""

from typing import Optional, Dict
import os
import re
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

MAX_PROMPT_LENGTH = 240
MAX_IMAGE_URL_LENGTH = 1024

# Response templates for common venue operations scenarios
RESPONSE_TEMPLATES = [
    {
        'keywords': ['wheelchair', 'accessible'],
        'reply': (
            'Accessible route recommended: use the east elevators, avoid the main concourse bottleneck, '
            'and follow the priority ramp to Section 210. A staff escort can be dispatched within 3 minutes.'
        )
    },
    {
        'keywords': ['transit', 'downtown', 'public'],
        'reply': (
            'Transit recommendation: take Metro Line 2 to Stadium North, then use the electric shuttle loop to Gate C. '
            'If crowds surge, switch to the park-and-ride at Harbor 7 and walk 8 minutes to the venue.'
        )
    },
    {
        'keywords': ['sustainability', 'emission', 'eco'],
        'reply': (
            'Sustainability plan: dispatch electric shuttles for volunteer loops, stagger shifts by zone, '
            'and prioritize walking paths between the fan zone and the operations hub to cut emissions by roughly 18%.'
        )
    },
    {
        'keywords': ['crowd', 'route', 'gate', 'congest', 'congestion'],
        'reply': (
            'Crowd management advice: reroute fans from Gate B to Gate D via the north corridor, '
            'open the family lane for strollers, and keep the west plaza clear for emergency vehicles.'
        )
    }
]


def sanitize_prompt(prompt: Optional[str]) -> str:
    """
    Sanitize user prompt: trim, lowercase, normalize whitespace, and enforce max length
    
    Args:
        prompt: Raw user input
    
    Returns:
        Sanitized and normalized prompt string
    """
    if not prompt:
        return ""
    s = str(prompt).strip().lower()
    s = re.sub(r"\s+", " ", s)  # Normalize whitespace
    return s[:MAX_PROMPT_LENGTH]


def sanitize_image_url(url: Optional[str]) -> str:
    """
    Validate and sanitize image URL: verify protocol and length
    
    Args:
        url: User-provided image URL
    
    Returns:
        Valid URL string or empty string if invalid
    """
    if not url:
        return ""
    s = str(url).strip()
    if len(s) > MAX_IMAGE_URL_LENGTH:
        return ""
    try:
        p = urlparse(s)
        if p.scheme in ("http", "https") and p.netloc:
            return s
    except Exception as e:
        logger.debug(f"URL parsing error: {e}")
    return ""


def build_reply(prompt: str) -> str:
    """
    Match prompt against predefined venue operation patterns and return deterministic response
    
    Args:
        prompt: Sanitized user prompt
    
    Returns:
        Guidance response from rules engine
    """
    lp = (prompt or "").lower()
    
    # Iterate through templates and return first match
    for template in RESPONSE_TEMPLATES:
        if any(keyword in lp for keyword in template['keywords']):
            return template['reply']
    
    # Default response for unmatched queries
    return (
        'AI guidance: maintain multilingual assistance in English, Spanish, and French, '
        'surface real-time queue alerts, and prioritize accessible and low-emission routes for the next 30 minutes.'
    )


class GeminiClient:
    """
    Lightweight Gemini API client for phrasing stadium operation guidance.
    
    In production, this client would call Google Gemini API to enhance the deterministic
    rule-based responses with natural language phrasing while maintaining factual accuracy.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini client with API key from parameter or environment variable
        
        Args:
            api_key: Optional Gemini API key; defaults to GEMINI_API_KEY env var
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    async def generate(self, system: str, user_message: str) -> str:
        """
        Generate response using Gemini API
        
        In a real deployment, this would call Google Gemini API.
        Here we implement a predictable stub for testing and deterministic behavior.
        
        Args:
            system: System prompt describing assistant role
            user_message: User's message to be phrased
        
        Returns:
            Phrased response from Gemini
        
        Raises:
            RuntimeError: If no API key is configured
        """
        if not self.api_key:
            raise RuntimeError("No Gemini API key configured")
        # Stub: would call Gemini API in production
        return f"[Gemini phrased] {user_message}"


async def get_assistant_reply(
    prompt: str, 
    image_url: Optional[str] = None
) -> Dict[str, Optional[str]]:
    """
    Get stadium operations assistant reply using rules-first approach with optional Gemini phrasing
    
    Process:
    1. Sanitize and validate user prompt and image URL
    2. Match against deterministic rule templates
    3. Optionally use Gemini API to phrase the response
    4. Fall back to rules-based response on any error
    
    Args:
        prompt: User query for stadium operations guidance
        image_url: Optional image URL (e.g., crowd photo)
    
    Returns:
        Dictionary with 'reply' and 'source' keys:
        - reply: The guidance response text
        - source: Either 'rules' or 'gemini' indicating response source
    """
    # Validate and normalize input
    sanitized = sanitize_prompt(prompt)
    if not sanitized:
        return {
            "reply": (
                "Please provide a short request such as crowd rerouting, accessibility help, "
                "transport guidance, or sustainability planning."
            ),
            "source": "rules"
        }

    # Sanitize image URL if provided
    image = sanitize_image_url(image_url)
    
    # Generate deterministic rule-based response
    rules_answer = build_reply(sanitized)

    # Attempt to use Gemini for phrasing if API key is configured
    gemini = GeminiClient()
    if gemini.api_key:
        try:
            phrased = await gemini.generate(
                system=(
                    "You are StadiumMate, a rules-first assistant for FIFA World Cup 2026 stadium operations. "
                    "Phrase the facts provided clearly and concisely in the user's language. Do not add new facts."
                ),
                user_message=rules_answer + (f"\n\nImage attached: {image}" if image else ""),
            )
            return {"reply": phrased, "source": "gemini"}
        except Exception as e:
            logger.warning(f"Gemini generation failed, falling back to rules: {e}")
    
    # Return deterministic rule-based response
    reply = rules_answer + (f" (Image attached: {image})" if image else "")
    return {"reply": reply, "source": "rules"}
