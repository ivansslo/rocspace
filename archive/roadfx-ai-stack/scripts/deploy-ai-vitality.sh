#!/bin/bash
# Script to deploy ai-vitality to Google Cloud Run
# Run this from your local terminal or Google Cloud Shell

gcloud run deploy ai-vitality \
  --source https://github.com/ivansslo/ai-vitality.git \
  --branch master \
  --region us-west1 \
  --allow-unauthenticated \
  --update-env-vars="GITHUB_PAT=${GITHUB_PAT},OWNER_GITHUB=ivansslo"
