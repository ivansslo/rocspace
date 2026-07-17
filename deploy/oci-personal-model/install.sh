#!/usr/bin/env bash
# Deploy ROCSPACE-INITIAL on an OCI VM.
# Requires: Docker Engine + Docker Compose plugin; no cloud/API credential is used.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL="${ROCSPACE_PERSONAL_MODEL:-rocspace-initial}"
BASE="${ROCSPACE_BASE_MODEL:-qwen2.5:1.5b}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Engine and the Compose plugin first." >&2
  exit 1
fi

cd "$ROOT"
docker compose up -d

printf 'Waiting for local Ollama service...\n'
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then break; fi
  sleep 2
done
curl -fsS http://127.0.0.1:11434/api/tags >/dev/null

printf 'Pulling base model %s (first run may take time)...\n' "$BASE"
docker exec rocspace-personal-model ollama pull "$BASE"

# Modelfile references the desired default image. If BASE is overridden, build
# a temporary Modelfile without writing credentials or configuration secrets.
if [ "$BASE" = "qwen2.5:1.5b" ]; then
  docker cp "$ROOT/Modelfile" rocspace-personal-model:/tmp/Modelfile
else
  sed "s/^FROM qwen2.5:1.5b/FROM $BASE/" "$ROOT/Modelfile" > /tmp/rocspace-Modelfile
  docker cp /tmp/rocspace-Modelfile rocspace-personal-model:/tmp/Modelfile
  rm -f /tmp/rocspace-Modelfile
fi

docker exec rocspace-personal-model ollama create "$MODEL" -f /tmp/Modelfile

echo "Model $MODEL is ready on the VM at http://127.0.0.1:11434"
echo "Run ./verify.sh to make a private inference test."
