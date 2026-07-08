StadiumMate — FastAPI backend (rules-before-LLM)

This folder contains a FastAPI port of the StadiumMate assistant: a rules-first deterministic engine with an optional Gemini phrasing layer.

Run locally (Python 3.11+):

```bash
python -m venv .venv
source .venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Run tests:

```bash
pip install -r requirements.txt
pytest -q
```

Docker & Cloud Run: see `cloudrun-deploy.md` for build and deploy commands.

Security notes:
- Prompts are sanitized and capped.
- Image URLs are validated for http/https only.
- The Gemini client is a stub; configure `GEMINI_API_KEY` in production.
