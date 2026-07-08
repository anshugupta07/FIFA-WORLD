"""
FastAPI app for StadiumMate assistant (rules-before-LLM design)
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .schemas import AssistantRequest, AssistantResponse
from .assistant import get_assistant_reply
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="StadiumMate Assistant", version="0.1.0")

# Allow local dev server (Vite) to proxy requests; production should lock this down.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/v1/assistant", response_model=AssistantResponse)
async def assistant(req: AssistantRequest):
    if not isinstance(req.prompt, str):
        raise HTTPException(status_code=400, detail="Prompt must be a string")
    if len(req.prompt) > 1000:
        raise HTTPException(status_code=413, detail="Prompt too long")

    result = await get_assistant_reply(req.prompt, getattr(req, 'imageUrl', None))
    return AssistantResponse(reply=result.get('reply'), source=result.get('source'))


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=False)
