# Deployment Guide: Vercel + Stadium Operations App

## Overview
This application consists of:
- **Client (React + Vite)**: Frontend UI (deployable to Vercel)
- **Server (Python FastAPI)**: Stadium operations API
- **Server (Node.js/Express)**: Alternative API backend

## Quick Start - Local Development

### 1. Install Dependencies

```bash
# Client
cd client
npm install

# Python backend
cd ../server_python
pip install -r requirements.txt

# Node.js backend (optional)
cd ../server
npm install
```

### 2. Start All Services

**Terminal 1 - React Frontend:**
```bash
cd client
npm run dev
# Opens at http://localhost:5173
```

**Terminal 2 - Python Backend:**
```bash
cd server_python
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
# Runs at http://localhost:8080
```

**Terminal 3 - Node.js Backend (optional):**
```bash
cd server
npm run dev
# Runs at http://localhost:4000
```

## Vercel Deployment

### Step 1: Deploy Client to Vercel

```bash
cd client

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Configure in Vercel Dashboard:**
- Project: `stadium-ops-client` (or your project name)
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### Step 2: Deploy Python Backend (Choose One)

#### Option A: Google Cloud Run (Recommended)

```bash
cd server_python
gcloud run deploy stadium-ops-api --source . --platform managed --region us-central1 --allow-unauthenticated
```

See `cloudrun-deploy.md` for detailed instructions.

#### Option B: Railway / Render / Heroku

Each platform supports Docker. The `Dockerfile` in `server_python/` is ready to use.

#### Option C: Your Own Server

Deploy the Python backend to your VPS and set the appropriate environment variables.

### Step 3: Configure Client to Connect to Backend

**After deploying the backend, update Vercel with the API URL:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_URL=https://your-backend-url.com` 
3. Redeploy: `vercel --prod`

**Examples:**
- Google Cloud Run: `VITE_API_URL=https://stadium-ops-api-abc123.run.app`
- Railway: `VITE_API_URL=https://stadium-ops-api.railway.app`
- Custom domain: `VITE_API_URL=https://api.yourdomain.com`

### Step 4: Update Backend CORS Settings

Set the `CORS_ORIGINS` environment variable on your backend:

```
CORS_ORIGINS=https://your-client-vercel-url.vercel.app,https://yourdomain.com
```

**Vercel Client URL format:**
- `https://your-project.vercel.app` (default)
- `https://yourdomain.com` (custom domain)

## Environment Variables

### Client (.env or Vercel Dashboard)
```
VITE_API_URL=https://your-backend-url.com
```

### Server Python (Backend)
```
CORS_ORIGINS=https://your-vercel-app.vercel.app
OPENAI_API_KEY=sk-... (optional)
GEMINI_API_KEY=... (optional)
```

## Troubleshooting

### "Unexpected token 'T', page is not valid JSON"
**Cause:** Client can't reach API or backend returns HTML error

**Solutions:**
1. Ensure `VITE_API_URL` is set in Vercel environment
2. Check backend is running and accessible
3. Verify CORS settings allow the client origin
4. Check backend logs for errors

### CORS Error
**Solution:** Update `CORS_ORIGINS` environment variable on backend to include your Vercel client URL

### 404 Not Found
**Cause:** API endpoint configuration wrong

**Check:**
```bash
# Test backend directly
curl https://your-backend-url/health

# Should return: {"status":"ok"}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                              │
│            (http://localhost:5173 or Vercel)               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              React Vite Client App                           │
│  - Renders UI                                                │
│  - Makes requests to /api/assistant                          │
│  - Uses VITE_API_URL environment variable                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
        ┌────────────────┴──────────────────┐
        ▼                                   ▼
┌──────────────────┐            ┌──────────────────────┐
│  Python Backend  │            │  Node.js Backend     │
│  (FastAPI)       │            │  (Express)           │
│  Port 8080       │            │  Port 4000           │
│  /v1/assistant   │            │  /api/assistant      │
└──────────────────┘            └──────────────────────┘
```

## Deployment Checklist

- [ ] Client dependencies installed (`npm install`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Local development working (`npm run dev` + backend running)
- [ ] Backend deployed (Google Cloud Run, Railway, etc.)
- [ ] Backend URL obtained
- [ ] Client deployed to Vercel
- [ ] `VITE_API_URL` set in Vercel environment variables
- [ ] Backend `CORS_ORIGINS` updated with Vercel client URL
- [ ] Client redeployed after environment variable changes
- [ ] Testing: Load Vercel client URL and test "Generate guidance" button
- [ ] Verify response shows AI guidance (not JSON error)

## Support

For issues:
1. Check backend logs: `vercel logs` or backend platform logs
2. Test backend directly: `curl https://your-backend-url/health`
3. Check browser console for CORS or fetch errors
4. Verify environment variables are set correctly
