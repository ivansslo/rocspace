#!/usr/bin/env bash
# Private local verification. Does not print secrets.
set -euo pipefail
MODEL="${ROCSPACE_PERSONAL_MODEL:-rocspace-initial}"

curl -fsS http://127.0.0.1:11434/api/generate \
  -H 'Content-Type: application/json' \
  -d "{\"model\":\"${MODEL}\",\"prompt\":\"Reply only: ROCSPACE_INITIAL_OK\",\"stream\":false}" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("response", "no response").strip())'
