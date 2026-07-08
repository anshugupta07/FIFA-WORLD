StadiumMate (FastAPI) — Cloud Run deployment guide

Build and push container (replace <PROJECT> and <REGION>):

```bash
# build and tag
docker build -t gcr.io/<PROJECT>/stadiummate:latest .
# push
docker push gcr.io/<PROJECT>/stadiummate:latest
# deploy to Cloud Run
gcloud run deploy stadiummate --image gcr.io/<PROJECT>/stadiummate:latest --region=<REGION> --platform=managed --allow-unauthenticated --port=8080
```

Set the `GEMINI_API_KEY` (or other secret) in Cloud Run environment variables for live phrasing.
