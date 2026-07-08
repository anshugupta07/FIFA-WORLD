"""
StadiumMate assistant module
- Implements a deterministic rules-first engine that resolves facility facts and live signals.
- Provides a lightweight Gemini client stub to phrase deterministic results when a key is present.
"""
from typing import Optional
import os
import re

MAX_PROMPT_LENGTH = 240


def sanitize_prompt(prompt: Optional[str]) -> str:
    if not prompt:
        return ""
    s = str(prompt).strip()
    s = re.sub(r"\s+", " ", s)
    return s[:MAX_PROMPT_LENGTH]


def sanitize_image_url(url: Optional[str]) -> str:
    if not url:
        return ""
    s = str(url).strip()
    if len(s) > 1024:
        return ""
    try:
        from urllib.parse import urlparse

        p = urlparse(s)
        if p.scheme in ("http", "https") and p.netloc:
            return s
    except Exception:
        return ""
    return ""


def build_reply(prompt: str) -> str:
    lp = (prompt or "").lower()
    if "wheelchair" in lp or "accessible" in lp:
        return (
            "Accessible route recommended: use the east elevators, avoid the main concourse bottleneck, "
            "and follow the priority ramp to Section 210. A staff escort can be dispatched within 3 minutes."
        )
    if any(k in lp for k in ("transit", "downtown", "public")):
        return (
            "Transit recommendation: take Metro Line 2 to Stadium North, then use the electric shuttle loop to Gate C. "
            "If crowds surge, switch to the park-and-ride at Harbor 7 and walk 8 minutes to the venue."
        )
    if any(k in lp for k in ("sustainability", "emission", "eco")):
        return (
            "Sustainability plan: dispatch electric shuttles for volunteer loops, stagger shifts by zone, "
            "and prioritize walking paths between the fan zone and the operations hub to cut emissions by roughly 18%."
        )
    if any(k in lp for k in ("crowd", "route", "gate", "congest", "congestion")):
        return (
            "Crowd management advice: reroute fans from Gate B to Gate D via the north corridor, "
            "open the family lane for strollers, and keep the west plaza clear for emergency vehicles."
        )
    return (
        "AI guidance: maintain multilingual assistance in English, Spanish, and French, "
        "surface real-time queue alerts, and prioritize accessible and low-emission routes for the next 30 minutes."
    )


class GeminiClient:
    """A tiny Gemini client stub. When GEMINI_API_KEY is configured we format a request
    but for security and portability in tests we do not call external services here.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    async def generate(self, system: str, user_message: str) -> str:
        # In a real deployment, this method would call Google Gemini with a client.
        # Here we implement a predictable stub: echo the deterministic result phrased.
        if not self.api_key:
            raise RuntimeError("No Gemini API key configured")
        # Return a safe, phrased version (no hallucination)
        return f"[Gemini phrasing] {user_message}"


async def get_assistant_reply(prompt: str, image_url: Optional[str] = None) -> dict:
    sanitized = sanitize_prompt(prompt)
    if not sanitized:
        return {"reply": "Please provide a short request such as crowd rerouting, accessibility help, transport guidance, or sustainability planning.", "source": "rules"}

    image = sanitize_image_url(image_url)
    # deterministic resolution
    rules_answer = build_reply(sanitized)

    # If Gemini available phrase the deterministic result
    gemini = GeminiClient()
    if gemini.api_key:
        try:
            phrased = await gemini.generate(
                system=(
                    "You are StadiumMate, a rules-first assistant for stadium operations. Phrase the facts provided "
                    "clearly and concisely in the user's language, do not add new facts."
                ),
                user_message=rules_answer + (f" Image: {image}" if image else ""),
            )
            return {"reply": phrased, "source": "gemini"}
        except Exception:
            # fallback to deterministic
            pass

    # fallback deterministic
    reply = rules_answer + (f" (Image attached: {image})" if image else "")
    return {"reply": reply, "source": "rules"}
