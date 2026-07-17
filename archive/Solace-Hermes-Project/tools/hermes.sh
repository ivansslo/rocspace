#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════╗
# ║  hermes.sh — Unified Hermes Agent Command Center  v3.2      ║
# ╚═══════════════════════════════════════════════════════════════╝
set -euo pipefail

# ─────────────────────────────────────────────────────────────────
#  Config
# ─────────────────────────────────────────────────────────────────
OPENROUTER_KEY="${OPENROUTER_API_KEY:-REPLACE_WITH_OPENROUTER_KEY}"
GROQ_KEY="${GROQ_API_KEY:-REPLACE_WITH_GROQ_KEY}"
GOOGLE_KEY="${GOOGLE_API_KEY:-REPLACE_WITH_GOOGLE_KEY}"
LITELLM_KEY="${LITELLM_MASTER_KEY:-REPLACE_WITH_LITELLM_KEY}"

# ─────────────────────────────────────────────────────────────────
#  Theme
# ─────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  R=$'\e[31m'  G=$'\e[32m'  Y=$'\e[33m'  B=$'\e[34m'
  C=$'\e[36m'  M=$'\e[35m'  W=$'\e[1;37m' D=$'\e[2m'
  N=$'\e[0m'   BOLD=$'\e[1m'
else
  R='' G='' Y='' B='' C='' M='' W='' D='' N='' BOLD=''
fi

line()  { printf '%s'"${D}$(printf '─%.0s' {1..62})${N}\n"; }
title() { printf '\n%s  %s  %s\n' "$W" "$1" "$N"; line; echo; }

# ─────────────────────────────────────────────────────────────────
#  Core helpers
# ─────────────────────────────────────────────────────────────────
_probe() {
  local alias="$1" mid="$2" prov="$3" tier="$4" url key
  case "$prov" in
    openrouter) url="https://openrouter.ai/api/v1/chat/completions"; key="$OPENROUTER_KEY" ;;
    groq)       url="https://api.groq.com/openai/v1/chat/completions"; key="$GROQ_KEY" ;;
    *)          printf '  %s⏭   %-20s %-40s %s%s\n' "$D" "$alias" "$mid" "skip" "$N"; return ;;
  esac
  local t0 code ms ok
  t0=$(date +%s%3N)
  code=$(curl -s -o /tmp/_hp.json -w '%{http_code}' --max-time 15 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $key" \
    -d "$(printf '{"model":"%s","messages":[{"role":"user","content":"hi"}],"max_tokens":1}' "$mid")" \
    "$url")
  ms=$(( $(date +%s%3N) - t0 ))
  if [[ "$code" == "200" ]]; then
    printf '  %s✅  %-20s %-40s %4sms%s\n' "$G" "$alias" "$mid" "$ms" "$N"
  else
    printf '  %s✗   %-20s %-40s code:%s%s\n' "$R" "$alias" "$mid" "$code" "$N"
  fi
}

# ─────────────────────────────────────────────────────────────────
#  Commands
# ─────────────────────────────────────────────────────────────────
cmd_scan() {
  title "🔍  SCANNING MODELS"
  python3 -c "
import yaml, os
with open('config.yaml') as f:
  c = yaml.safe_load(f)
  for p, ms in c.get('models', {}).items():
    for m in ms:
      print(f\"{m['alias']}|{m['model_id']}|{p}|{m['tier']}\")
" | while IFS='|' read -r a m p t; do
    _probe "$a" "$m" "$p" "$t"
  done
}

cmd_help() {
  printf '\n  %sHermes Unified CLI%s\n\n' "$W" "$N"
  printf '  %sUsage:%s  ./hermes.sh <command>\n\n' "$BOLD" "$N"
  printf '  %sscan%s                      Health-check all models in config.yaml\n' "$C" "$N"
  printf '  %spush%s                      Push updates to GitHub\n' "$C" "$N"
  printf '\n'
}

# ─────────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────────
case "${1:-}" in
  scan) cmd_scan ;;
  push) bash scripts/push-update.sh ;;
  *)    cmd_help ;;
esac
