#!/usr/bin/env bash
set -euo pipefail

# Securely push secrets from your current shell environment to Cloudflare Worker.
# Usage:
#   export TOKEN='...'
#   export GROQ_KEY='...'
#   ./scripts/set-worker-secrets.sh hermes-cloudflare
# Or for env:
#   ./scripts/set-worker-secrets.sh hermes-webhook --env webhook

WORKER_NAME="${1:-hermes-cloudflare}"
shift || true
EXTRA_ARGS=("$@")

SECRETS=(
  TOKEN
  GROQ_KEY
  OR_KEY
  OR_PROV_KEY
  GEMINI_KEY
  CLAW_KEY
  CLAWLINK_KEY
  TAILSCALE_KEY
  HONCHO_KEY
  SOLACE_URL
  SOLACE_USER
  SOLACE_PASS
  SOLACE_API_TOKEN
  SOLACE_SEMP_URL
  SOLACE_VIEW_USER
  SOLACE_VIEW_PASS
  CLERK_PK
  CLERK_SK
  GITHUB_PAT
)

for key in "${SECRETS[@]}"; do
  value="${!key-}"
  if [[ -n "$value" ]]; then
    printf '%s' "$value" | npx wrangler secret put "$key" --name "$WORKER_NAME" "${EXTRA_ARGS[@]}"
    echo "✓ $key uploaded"
  else
    echo "- $key skipped (not set)"
  fi
done
