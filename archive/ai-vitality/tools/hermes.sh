#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════╗
# ║  hermes.sh — Unified Hermes Agent Command Center  v3.1      ║
# ╚═══════════════════════════════════════════════════════════════╝
set -euo pipefail

# ─────────────────────────────────────────────────────────────────
#  Config
# ─────────────────────────────────────────────────────────────────
RENDER_KEY="${RENDER_API_KEY:-REPLACE_WITH_RENDER_KEY}"
OPENROUTER_KEY="${OPENROUTER_API_KEY:-REPLACE_WITH_OPENROUTER_KEY}"
GROQ_KEY="${GROQ_API_KEY:-REPLACE_WITH_GROQ_KEY}"
GOOGLE_KEY="${GOOGLE_API_KEY:-AQ.Ab8RN6LnH-oDz9z1RMuOm_q47j6M6jMGNKQp2PCCa_axqZioJQ}"
LITELLM_KEY="${LITELLM_MASTER_KEY:-REPLACE_WITH_LITELLM_KEY}"

SVC_HERMES="srv-d93nr3e7r5hc73demfe0"
SSH_ADDR="srv-d93nr3e7r5hc73demfe0@ssh.singapore.render.com"
API="https://api.render.com/v1"

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
_api() {
  curl -s "${API}$1" -H "Authorization: Bearer $RENDER_KEY" "${@:2}" 2>/dev/null
}

_job() {
  local cmd="$1" desc="${2:-job}" wait="${3:-120}"
  printf '  %s⏳  %s …%s\n' "$D" "$desc" "$N"
  local jid
  jid=$(python3 -c "
import json,subprocess
r=subprocess.run(['curl','-s','-X','POST',
  '$API/services/$SVC_HERMES/jobs',
  '-H','Authorization: Bearer $RENDER_KEY',
  '-H','Content-Type: application/json',
  '-d',json.dumps({'startCommand':'''$cmd'''})],
  capture_output=True,text=True,timeout=15)
print(json.loads(r.stdout).get('id',''))
" 2>/dev/null)
  [[ -z "$jid" ]] && { echo "  ${R}✗  create failed${N}"; return 1; }
  printf '  %s   ↳ %s%s\n' "$D" "$jid" "$N"
  local t=0
  while (( t < wait )); do
    sleep 15; (( t+=15 ))
    local s
    s=$(_api "/services/$SVC_HERMES/jobs/$jid" \
        | python3 -c "import json,sys;print(json.load(sys.stdin).get('status','?'))" 2>/dev/null)
    case "$s" in
      succeeded) printf '  %s✅  %s%s\n' "$G" "$desc" "$N"; return 0 ;;
      failed)    printf '  %s✗   %s — FAILED%s\n' "$R" "$desc" "$N"; return 1 ;;
      *)         printf '  %s   [%ss] %s%s\n' "$D" "$t" "$s" "$N" ;;
    esac
  done
  printf '  %s⚠   timeout %ss%s\n' "$Y" "$wait" "$N"; return 1
}

_deploy_wait() {
  local dep
  dep=$(_api "/services/$SVC_HERMES/deploys" \
        -X POST -H "Content-Type: application/json" -d '{}' \
        | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])" 2>/dev/null)
  printf '  %s⏳  deploy %s%s\n' "$D" "$dep" "$N"
  local t=0
  while (( t < 180 )); do
    sleep 15; (( t+=15 ))
    local s
    s=$(_api "/services/$SVC_HERMES/deploys/$dep" \
        | python3 -c "import json,sys;print(json.load(sys.stdin)['status'])" 2>/dev/null)
    printf '  %s   [%ss] %s%s\n' "$D" "$t" "$s" "$N"
    [[ "$s" == "live"   ]] && { printf '  %s✅  deploy live%s\n' "$G" "$N"; return 0; }
    [[ "$s" =~ failed   ]] && { printf '  %s✗   deploy failed%s\n' "$R" "$N"; return 1; }
  done
  return 1
}

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
    -X POST "$url" \
    -H "Authorization: Bearer $key" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$mid\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"max_tokens\":5}" \
    2>/dev/null || echo 000)
  ms=$(( $(date +%s%3N) - t0 ))
  ok=$(python3 -c "import json;d=json.load(open('/tmp/_hp.json'));print('Y' if 'choices' in d else 'N')" 2>/dev/null || echo N)
  if   [[ "$ok" == "Y"      ]]; then printf '  %s✅  %-20s  %-40s  %-8s  %4dms%s\n' "$G" "$alias" "$mid" "$tier" "$ms" "$N"
  elif [[ "$code" == "429"   ]]; then printf '  %s⚡  %-20s  %-40s  %-8s  %4dms%s\n' "$Y" "$alias" "$mid" "$tier" "$ms" "$N"
  else                                printf '  %s✗   %-20s  %-40s  %-8s  %4dms%s\n' "$R" "$alias" "$mid" "$tier" "$ms" "$N"
  fi
}

# ─────────────────────────────────────────────────────────────────
#  Banner
# ─────────────────────────────────────────────────────────────────
banner() {
  echo
  printf '%s' "$C"
  cat <<'ART'
    ╦ ╦╔═╗╦═╗╔╦╗╔═╗╔═╗
    ╠═╣║╣ ╠╦╝║║║║╣ ╚═╗
    ╩ ╩╚═╝╩╚═╩ ╩╚═╝╚═╝
ART
  printf '%s    Command Center v3.1%s\n\n' "$D" "$N"
}

# ═════════════════════════════════════════════════════════════════
#  help
# ═════════════════════════════════════════════════════════════════
cmd_help() {
  banner
  printf '%sCORE%s\n' "$W" "$N"
  printf '  %schat%s                      %s★ Interactive Hermes — langsung dari local%s\n' "$C" "$N" "$G" "$N"
  printf '  %schat%s MODEL                Interactive with specific model\n' "$C" "$N"
  printf '  %ssetup%s                     Full first-time setup\n' "$C" "$N"
  printf '  %sstatus%s                    Quick overview\n' "$C" "$N"
  printf '  %sdeploy%s                    Redeploy Hermes on Render\n' "$C" "$N"
  printf '  %sssh%s                       Shell into Hermes container\n' "$C" "$N"
  printf '  %senv%s                       List environment variables\n' "$C" "$N"
  echo
  printf '%sLOGIN%s  %s(SSH tunnel — bypass team access control)%s\n' "$W" "$N" "$D" "$N"
  printf '  %slogin%s                     Show service map\n' "$C" "$N"
  printf '  %slogin%s SERVICE             Open tunnel (foreground)\n' "$C" "$N"
  printf '  %slogin%s SERVICE %s--bg%s        Open tunnel (background)\n' "$C" "$N" "$C" "$N"
  printf '  %slogin all%s                 Tunnel every service\n' "$C" "$N"
  echo
  printf '%sMODELS%s\n' "$W" "$N"
  printf '  %sscan%s                      Probe all services + models\n' "$C" "$N"
  printf '  %sscan --quick%s              Services only (no model probe)\n' "$C" "$N"
  printf '  %sset-model%s MODEL           Change default model\n' "$C" "$N"
  echo
  printf '%sWEBHOOK%s\n' "$W" "$N"
  printf '  %swebhook status%s            Connectivity + endpoints\n' "$C" "$N"
  printf '  %swebhook test%s URL          Test crawl via webhook\n' "$C" "$N"
  printf '  %swebhook map%s               Integration diagram\n' "$C" "$N"
  echo
  printf '%sDATA%s\n' "$W" "$N"
  printf '  %srun%s "prompt"              One-shot agent task\n' "$C" "$N"
  printf '  %spush-config%s               Push config + .env to disk\n' "$C" "$N"
  printf '  %smemory read%s               Read MEMORY.md + USER.md\n' "$C" "$N"
  printf '  %smemory seed%s               Re-seed MEMORY.md\n' "$C" "$N"
  printf '  %scron list%s                 Scheduled jobs\n' "$C" "$N"
  printf '  %scron add%s SCHED PROMPT NAME\n' "$C" "$N"
  printf '  %sbackup%s                    Full backup → /var/data/backups\n' "$C" "$N"
  printf '  %sjobs%s [N]                  Recent Render jobs\n' "$C" "$N"
  echo
  printf '%sEXAMPLES%s\n' "$W" "$N"
  printf '  %s./hermes.sh chat%s                        %s# ★ interactive AI agent%s\n' "$G" "$N" "$D" "$N"
  printf '  %s./hermes.sh chat qwen/qwen3-32b%s        %s# chat with specific model%s\n' "$G" "$N" "$D" "$N"
  printf '  %s./hermes.sh login clawrender%s           %s# tunnel → localhost:3000%s\n' "$G" "$N" "$D" "$N"
  printf '  %s./hermes.sh login all --bg%s              %s# tunnel everything%s\n' "$G" "$N" "$D" "$N"
  printf '  %s./hermes.sh scan%s                        %s# health-check all models%s\n' "$G" "$N" "$D" "$N"
  printf '  %s./hermes.sh set-model deepseek/deepseek-r1%s\n' "$G" "$N"
  printf '  %s./hermes.sh run "Summarize AI papers"%s   %s# one-shot task%s\n' "$G" "$N" "$D" "$N"
  echo
}

# ═════════════════════════════════════════════════════════════════
#  status
# ═════════════════════════════════════════════════════════════════
cmd_status() {
  title "📊  STATUS"
  _api "/services/$SVC_HERMES" | python3 -c "
import json,sys; d=json.load(sys.stdin); s=d.get('serviceDetails',{})
ok='🟢' if d['suspended']=='not_suspended' else '🔴'
print(f'  {ok}  {d[\"name\"]}')
print(f'      URL     {s.get(\"url\")}')
print(f'      Region  {s.get(\"region\")}   Plan  {s.get(\"plan\")}')
print(f'      SSH     {s.get(\"sshAddress\")}')
" 2>/dev/null

  printf '\n  %s▸ Deploy%s\n' "$B" "$N"
  _api "/services/$SVC_HERMES/deploys?limit=1" | python3 -c "
import json,sys; d=json.load(sys.stdin)[0]['deploy']
ok='🟢' if d['status']=='live' else '🟡'
print(f'  {ok}  {d[\"id\"]}   {d[\"status\"]}   {d[\"createdAt\"][:19]}')
" 2>/dev/null

  printf '\n  %s▸ Providers%s\n' "$B" "$N"
  _api "/services/$SVC_HERMES/env-vars" | python3 -c "
import json,sys
keys=[i.get('envVar',i)['key'] for i in json.load(sys.stdin)]
p=[]
  if any(tag in k for k in keys): p.append(label)
nk=sum(1 for k in keys if any(x in k for x in ('KEY','TOKEN','AUTH')))
print(f'  🔑  {nk} keys — {\" · \".join(p)}')
" 2>/dev/null

  printf '\n  %s▸ Recent Jobs%s\n' "$B" "$N"
  _api "/services/$SVC_HERMES/jobs?limit=5" | python3 -c "
import json,sys
for j in json.load(sys.stdin):
  j=j.get('job',j)
  i={'succeeded':'✅','failed':'❌'}.get(j['status'],'⏳')
  print(f'  {i}  {j[\"id\"][:24]}  {j[\"status\"]:10s}  {j[\"startCommand\"][:40]}')
" 2>/dev/null
  echo
}

# ═════════════════════════════════════════════════════════════════
#  scan
# ═════════════════════════════════════════════════════════════════
cmd_scan() {
  banner
  local quick="${1:-}"

  # ── Services ───────────────────────────────────────────────────
  title "🏗   RENDER SERVICES"
  _api "/services?limit=20" | python3 -c "
import json,sys
for i in json.load(sys.stdin):
  s=i['service']; d=s.get('serviceDetails',{})
  ok='🟢' if s['suspended']=='not_suspended' else '🔴'
  plan=d.get('plan',s.get('type','?'))
  rgn=d.get('region','') if isinstance(d,dict) else ''
  url=d.get('url','')
  print(f'  {ok}  {s[\"name\"]:28s}  {plan:12s}  {rgn:10s}  {url}')
" 2>/dev/null

  # ── Gateways ───────────────────────────────────────────────────
  title "🌐  GATEWAYS"
  local -a gw=(
    "OpenRouter|https://openrouter.ai/api/v1/models|$OPENROUTER_KEY"
    "Groq|https://api.groq.com/openai/v1/models|$GROQ_KEY"
    "CodexMaster|https://codex-master-ai-api-uijc.onrender.com/health|"
    "Hermes|https://hermes-agent-render-rdd2.onrender.com/health|"
    "LiteLLM|https://hermes-agent-api.onrender.com/health/liveliness|$LITELLM_KEY"
    "Crawl4AI-MCP|https://mcp-crawl4ai.onrender.com/|"
    "Crawl4AI-Py|https://crawl4ai-mcp.onrender.com/|"
    "Clawrender|https://clawrender.onrender.com/|"
  )
  for entry in "${gw[@]}"; do
    IFS='|' read -r name url key <<< "$entry"
    local hdr=""; [[ -n "$key" ]] && hdr="-H Authorization:\ Bearer\ $key"
    local t0 code ms icon
    t0=$(date +%s%3N)
    code=$(eval curl -s -o /dev/null -w '%{http_code}' --max-time 10 \""$url"\" $hdr 2>/dev/null || echo 000)
    ms=$(( $(date +%s%3N) - t0 ))
    case "$code" in
      200|201) icon="${G}✅" ;; 403) icon="${Y}🔒" ;; *) icon="${R}❌" ;;
    esac
    printf '  %s  %-18s  HTTP %-3s  %4dms  %s%s\n' "$icon" "$name" "$code" "$ms" "$url" "$N"
  done

  # ── Models ─────────────────────────────────────────────────────
  if [[ "$quick" == "--quick" ]]; then
    printf '\n  %s(--quick: model probes skipped)%s\n\n' "$D" "$N"
    return
  fi

  title "🤖  MODELS — Live Probe"

  printf '  %s▸ OpenRouter%s\n' "$B" "$N"
  _probe gemini-2.5-pro   google/gemini-2.5-pro-preview openrouter premium
  _probe gemini-2.5-flash google/gemini-2.5-flash       openrouter premium
  _probe gemma-4-31b-free google/gemma-4-31b-it:free    openrouter free
  _probe gpt-4o           openai/gpt-4o                 openrouter premium
  _probe deepseek-r1      deepseek/deepseek-r1          openrouter premium
  _probe qwen3-235b       qwen/qwen3-235b-a22b          openrouter premium
  _probe qwen3-32b        qwen/qwen3-32b                openrouter premium
  _probe qwen3-30b        qwen/qwen3-30b-a3b            openrouter premium

  printf '\n  %s▸ Groq ⚡%s\n' "$G" "$N"
  _probe llama-3.3-70b    llama-3.3-70b-versatile                   groq free
  _probe llama-4-scout    meta-llama/llama-4-scout-17b-16e-instruct groq free
  _probe qwen3-32b-groq   qwen/qwen3-32b                            groq free
  _probe qwen3.6-27b      qwen/qwen3.6-27b                          groq free
  _probe gpt-oss-120b     openai/gpt-oss-120b                       groq free
  _probe gpt-oss-20b      openai/gpt-oss-20b                        groq free
  _probe compound         groq/compound                              groq free
  _probe compound-mini    groq/compound-mini                         groq free
  _probe llama-3.1-8b     llama-3.1-8b-instant                      groq free
  _probe allam-2-7b       allam-2-7b                                 groq free
  echo
}

# ═════════════════════════════════════════════════════════════════
#  setup
# ═════════════════════════════════════════════════════════════════
cmd_setup() {
  banner
  title "📦  FULL SETUP"

  printf '  %s[1/6]%s  Set env vars\n' "$B" "$N"
  for pair in \
    "OPENROUTER_API_KEY|$OPENROUTER_KEY" "OPENAI_API_KEY|$OPENAI_KEY" \
    "GROQ_API_KEY|$GROQ_KEY" "GOOGLE_API_KEY|$GOOGLE_KEY" \
    "HERMES_INFERENCE_PROVIDER|openrouter" "HERMES_HOME|/var/data"; do
    IFS='|' read -r k v <<< "$pair"
    _api "/services/$SVC_HERMES/env-vars/$k" -X PUT \
      -H "Content-Type: application/json" -d "{\"value\":\"$v\"}" >/dev/null 2>&1
    printf '  %s✅  %s%s\n' "$G" "$k" "$N"
  done

  printf '\n  %s[2/6]%s  Push config.yaml + .env\n' "$B" "$N"
  cmd_push_config

  printf '\n  %s[3/6]%s  Create directories\n' "$B" "$N"
  _job 'mkdir -p /var/data/{workspace,hooks,memories,cron/output,knowledge,exports,backups,sessions,logs,plans,skins,home}' "directories"

  printf '\n  %s[4/6]%s  Write SOUL.md\n' "$B" "$N"
  local soul; soul=$(base64 -w0 <<'EOF'
# SOUL — Hermes Agent
You are a data-aware agent on Render Singapore (pro_max).
## Capabilities
- Persistent memory (MEMORY.md / USER.md)
- Web crawling via Crawl4AI MCP
- Cron scheduling
- Knowledge base at /var/data/knowledge/
- 18 AI models (OpenRouter + Groq)
## Rules
1. Persist findings → MEMORY.md
2. Structured data → /var/data/knowledge/
3. Cron for recurring tasks; always tag timestamps + sources
EOF
  )
  _job "echo $soul | base64 -d > /var/data/SOUL.md" "SOUL.md"

  printf '\n  %s[5/6]%s  Seed MEMORY.md\n' "$B" "$N"
  local mem; mem=$(base64 -w0 <<'EOF'
§
[2026-07-05] Setup complete — Render Singapore pro_max, disk /var/data 10 GB
OpenRouter + Groq (18 models). Default: google/gemini-2.5-pro-preview
§
[2026-07-05] Running models
OpenRouter: gemini-2.5-pro/flash, gpt-4o, deepseek-r1, qwen3-235b/32b/30b, gemma-4-31b:free
Groq⚡: llama-3.3-70b, llama-4-scout, qwen3-32b, qwen3.6-27b, gpt-oss-120b/20b, compound/mini, llama-3.1-8b, allam-2-7b
EOF
  )
  _job "echo $mem | base64 -d > /var/data/memories/MEMORY.md" "MEMORY.md"

  printf '\n  %s[6/6]%s  Create hooks\n' "$B" "$N"
  local hook; hook=$(base64 -w0 <<'EOF'
#!/bin/bash
D=/var/data/backups/sessions; mkdir -p "$D"
cp /var/data/state.db "$D/state_$(date +%Y%m%d_%H%M%S).db" 2>/dev/null
ls -t "$D"/state_*.db 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
EOF
  )
  _job "echo $hook | base64 -d > /var/data/hooks/post-session-backup.sh && chmod +x /var/data/hooks/post-session-backup.sh" "backup hook"

  printf '\n  %s[✦]%s  Deploy\n' "$B" "$N"
  _deploy_wait

  echo
  printf '  %s✨  SETUP COMPLETE%s\n\n' "${G}${BOLD}" "$N"
  printf '  ssh %s\n' "$SSH_ADDR"
  printf '  %shermes%s                            %s# interactive%s\n' "$C" "$N" "$D" "$N"
  printf '  %shermes chat -q "hello world"%s      %s# one-shot%s\n\n' "$C" "$N" "$D" "$N"
}

# ═════════════════════════════════════════════════════════════════
#  push-config
# ═════════════════════════════════════════════════════════════════
cmd_push_config() {
  local cfg; cfg=$(base64 -w0 <<'EOF'
model:
  default: qwen/qwen3-32b
  provider: groq
  base_url: https://api.groq.com/openai/v1
providers:
  groq:       {request_timeout_seconds: 30,  stale_timeout_seconds: 60}
  openrouter: {request_timeout_seconds: 180, stale_timeout_seconds: 600}
terminal:
  backend: local
  cwd: /var/data/workspace
  timeout: 600
agent: {max_turns: 200}
mcp_servers:
  crawl4ai:        {url: "https://mcp-crawl4ai.onrender.com", timeout: 120}
  crawl4ai-python: {url: "https://crawl4ai-mcp.onrender.com", timeout: 120}
hooks:
  post_session: [/var/data/hooks/post-session-backup.sh]
EOF
  )
  _job "echo $cfg | base64 -d > /var/data/config.yaml" "config.yaml"

  local env; env=$(base64 -w0 <<__ENV__
OPENROUTER_API_KEY=$OPENROUTER_KEY
OPENAI_API_KEY=$OPENAI_KEY
GROQ_API_KEY=$GROQ_KEY
GOOGLE_API_KEY=$GOOGLE_KEY
__ENV__
  )
  _job "echo $env | base64 -d > /var/data/.env" ".env"
}

# ═════════════════════════════════════════════════════════════════
#  deploy
# ═════════════════════════════════════════════════════════════════
cmd_deploy() { title "🚀  DEPLOY"; _deploy_wait; echo; }

# ═════════════════════════════════════════════════════════════════
#  set-model
# ═════════════════════════════════════════════════════════════════
cmd_set_model() {
  local model="${1:?Usage: hermes.sh set-model MODEL}"
  title "🤖  SET MODEL → $model"
  local cfg
  # Detect provider from model name
  local prov="groq" base="https://api.groq.com/openai/v1"
  case "$model" in
    google/*|openai/gpt*|deepseek/*|qwen/qwen3-235*|anthropic/*) prov="openrouter"; base="https://openrouter.ai/api/v1" ;;
  esac
  cfg=$(printf 'model:\n  default: %s\n  provider: %s\n  base_url: %s\nterminal: {backend: local, cwd: /var/data/workspace, timeout: 600}\nagent: {max_turns: 200}\nmcp_servers:\n  crawl4ai: {url: "https://mcp-crawl4ai.onrender.com", timeout: 120}\n  crawl4ai-python: {url: "https://crawl4ai-mcp.onrender.com", timeout: 120}\n' "$model" "$prov" "$base")
  local b64; b64=$(echo "$cfg" | base64 -w0)
  _job "echo $b64 | base64 -d > /var/data/config.yaml" "model → $model"
  printf '  %s⟳  Run  hermes.sh deploy  to apply%s\n\n' "$Y" "$N"
}

# ═════════════════════════════════════════════════════════════════
#  login
# ═════════════════════════════════════════════════════════════════
cmd_login() {
  local target="${1:-}"

  declare -A LSSH=(
    [hermes]="srv-d93nr3e7r5hc73demfe0@ssh.singapore.render.com"
    [clawrender]="srv-d955cku7r5hc73e1t4c0@ssh.singapore.render.com"
    [litellm]="srv-d937h7a8qa3s73di0030@ssh.singapore.render.com"
    [codex]="srv-d9538rnavr4c739si0n0@ssh.oregon.render.com"
    [hermes-ui]="srv-d92tl1kvikkc73b4lrmg@ssh.oregon.render.com"
    [hermes-webui]="srv-d92v7vdaeets73ap9hh0@ssh.oregon.render.com"
    [debate-club]="srv-d9528edckfvc73apfltg@ssh.oregon.render.com"
    [crawl4ai]="srv-d91nis1kh4rs73al796g@ssh.oregon.render.com"
    [crawl4ai-mcp]="srv-d91p8ta8qa3s73b0vfug@ssh.oregon.render.com"
    [webhook]="srv-d91mtcsm0tmc73d4cs50@ssh.oregon.render.com"
  )
  declare -A LPORT=(
    [hermes]=9119     [clawrender]=3000  [litellm]=8000
    [codex]=8001      [hermes-ui]=9120   [hermes-webui]=9121
    [debate-club]=3001 [crawl4ai]=8002   [crawl4ai-mcp]=8003
    [webhook]=5000
  )

  # ── list ───────────────────────────────────────────────────────
  if [[ -z "$target" || "$target" == "list" ]]; then
    title "🔐  LOGIN — SSH Tunnel"
    printf '  Render team services need an SSH tunnel to reach.\n'
    printf '  %sPre-req: register your SSH key at dashboard.render.com%s\n\n' "$D" "$N"
    printf '  %s%-16s  %-6s  %s%s\n' "$W" "SERVICE" "PORT" "BROWSER URL" "$N"
    line
    for svc in hermes clawrender litellm codex hermes-ui hermes-webui debate-club crawl4ai crawl4ai-mcp webhook; do
      printf '  %s%-16s%s  %-6s  http://localhost:%s\n' "$C" "$svc" "$N" "${LPORT[$svc]}" "${LPORT[$svc]}"
    done
    echo
    printf '  %sUsage:%s  ./hermes.sh login %sSERVICE%s [--bg]\n' "$W" "$N" "$C" "$N"
    printf '          ./hermes.sh login %sall%s [--bg]\n\n' "$C" "$N"
    return
  fi

  local bg="${2:-}"

  # ── all ────────────────────────────────────────────────────────
  if [[ "$target" == "all" ]]; then
    title "🔐  LOGIN ALL"
    for svc in hermes clawrender litellm codex hermes-ui; do
      ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
          -N -f -L "${LPORT[$svc]}:localhost:10000" "${LSSH[$svc]}" 2>/dev/null \
        && printf '  %s✅  %-16s → http://localhost:%s%s\n' "$G" "$svc" "${LPORT[$svc]}" "$N" \
        || printf '  %s✗   %-16s  tunnel failed%s\n' "$R" "$svc" "$N"
    done
    printf '\n  %sKill:%s  pkill -f '\''ssh.*-L.*render.com'\''\n\n' "$D" "$N"
    return
  fi

  # ── single ─────────────────────────────────────────────────────
  local addr="${LSSH[$target]:-}" port="${LPORT[$target]:-}"
  [[ -z "$addr" ]] && { printf '  %s✗  Unknown: %s%s\n' "$R" "$target" "$N"; return 1; }

  title "🔐  LOGIN → $target"
  printf '  Tunnel  localhost:%s%s%s → container:10000\n\n' "$C" "$port" "$N"

  if [[ "$bg" == "--bg" ]]; then
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        -N -f -L "${port}:localhost:10000" "$addr" 2>/dev/null \
      && printf '  %s✅  http://localhost:%s%s\n' "$G" "$port" "$N" \
      || { printf '  %s✗   failed (SSH key?)%s\n' "$R" "$N"; return 1; }
    printf '  %sKill: pkill -f '\''ssh.*-L.*%s.*render.com'\''%s\n\n' "$D" "$port" "$N"
  else
    printf '  %sCtrl+C to close%s\n' "$Y" "$N"
    printf '  %s➜  http://localhost:%s%s\n\n' "$G" "$port" "$N"
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        -N -L "${port}:localhost:10000" "$addr"
  fi
}

# ═════════════════════════════════════════════════════════════════
#  chat — interactive hermes session from local terminal
# ═════════════════════════════════════════════════════════════════
cmd_chat() {
  local model="${1:-}"
  local extra_args=""
  [[ -n "$model" ]] && extra_args="--model $model"

  banner
  printf '  %s💬  Interactive Hermes%s\n' "$W" "$N"
  [[ -n "$model" ]] && printf '  %sModel  %s%s%s\n' "$D" "$C" "$model" "$N"
  line
  echo

  # Test SSH connectivity first
  if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes \
       "$SSH_ADDR" "echo ok" &>/dev/null; then

    # SSH works → full interactive
    printf '  %s✅  SSH connected — opening interactive session%s\n' "$G" "$N"
    printf '  %s/help = commands   /model = switch   /quit = exit   Ctrl+C = force%s\n' "$D" "$N"
    line
    echo
    ssh -tt -o StrictHostKeyChecking=no -o ConnectTimeout=15 \
      "$SSH_ADDR" \
      "source /opt/hermes/.venv/bin/activate && HERMES_HOME=/var/data exec hermes $extra_args"
  else
    # SSH unavailable → guide user
    printf '  %s✗  SSH key not registered%s\n\n' "$R" "$N"
    printf '  Hermes interactive requires SSH access to the Render container.\n'
    printf '  Register your SSH key with these steps:\n\n'
    printf '  %s1.%s  Generate key (if you don'\''t have one):\n' "$W" "$N"
    printf '      %sssh-keygen -t ed25519 -C "hermes"%s\n\n' "$C" "$N"
    printf '  %s2.%s  Copy your public key:\n' "$W" "$N"
    printf '      %scat ~/.ssh/id_ed25519.pub%s\n\n' "$C" "$N"
    printf '  %s3.%s  Paste it at:\n' "$W" "$N"
    printf '      %shttps://dashboard.render.com/settings/ssh-keys%s\n' "$G" "$N"
    printf '      Login: %sivansuselo@gmail.com%s\n\n' "$C" "$N"
    printf '  %s4.%s  Then run again:\n' "$W" "$N"
    printf '      %s./hermes.sh chat%s\n\n' "$C" "$N"
    line
    printf '\n  %sAlternative — one-shot (no SSH needed):%s\n' "$W" "$N"
    printf '  %s./hermes.sh run "your question here"%s\n\n' "$C" "$N"
  fi
}

# ═════════════════════════════════════════════════════════════════
#  ssh — raw shell into container
# ═════════════════════════════════════════════════════════════════
cmd_ssh() {
  printf '  %s🔌  %s%s\n' "$C" "$SSH_ADDR" "$N"
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SSH_ADDR" "$@" \
    || printf '\n  %s✗  SSH failed — register key at dashboard.render.com/settings/ssh-keys%s\n\n' "$R" "$N"
}

# ═════════════════════════════════════════════════════════════════
#  webhook — test & trigger webhook integrations
# ═════════════════════════════════════════════════════════════════
cmd_webhook() {
  local sub="${1:-status}"; shift 2>/dev/null || true

  local WH_URL="https://crawl4ai-zapier-webhook.onrender.com"

  case "$sub" in

    status)
      title "🔗  WEBHOOK INTEGRATION"

      printf '  %s▸ Connectivity (internal, via Hermes container)%s\n\n' "$B" "$N"
      # Test health from inside Hermes
      _job "curl -so /dev/null -w '%{http_code}' $WH_URL/health" "webhook /health" 90
      _job "curl -so /dev/null -w '%{http_code}' https://crawl4ai-mcp.onrender.com/" "crawl4ai-mcp /" 90
      _job "curl -so /dev/null -w '%{http_code}' https://hermes-agent-api.onrender.com/health/liveliness" "litellm /health" 90

      printf '\n  %s▸ Service Info%s\n' "$B" "$N"
      _api "/services/srv-d91mtcsm0tmc73d4cs50" | python3 -c "
import json,sys; d=json.load(sys.stdin); s=d.get('serviceDetails',{})
print(f'  URL      {s.get(\"url\")}')
print(f'  Region   {s.get(\"region\")}   Plan  {s.get(\"plan\")}')
print(f'  Status   {d.get(\"suspended\")}')
" 2>/dev/null

      printf '\n  %s▸ Endpoints%s\n' "$B" "$N"
      printf '  POST  %s/webhook/trigger%s   async crawl → callback\n' "$C" "$N"
      printf '  POST  %s/webhook/catch%s     sync crawl (≤30s response)\n' "$C" "$N"
      printf '  GET   %s/result/<id>%s       poll crawl result\n' "$C" "$N"
      printf '  GET   %s/health%s            health check\n' "$C" "$N"

      printf '\n  %s▸ Access%s\n' "$B" "$N"
      printf '  Internal  %s✅  services can reach each other inside Render%s\n' "$G" "$N"
      printf '  External  %s❌  blocked by team access control (403)%s\n' "$R" "$N"
      printf '  Tunnel    %s./hermes.sh login webhook --bg%s → localhost:5000\n\n' "$C" "$N"
      ;;

    test)
      local url="${1:-https://example.com}"
      title "🔗  WEBHOOK TEST CRAWL"
      printf '  Target: %s%s%s\n\n' "$C" "$url" "$N"

      local body_b64
      body_b64=$(python3 -c "import json,base64;print(base64.b64encode(json.dumps({'url':'$url','formats':['markdown']}).encode()).decode())")

      _job "echo $body_b64 | base64 -d | curl -so /var/data/wh_result.json -w '%{http_code}' -X POST $WH_URL/webhook/catch -H 'Content-Type: application/json' -d @-" \
           "crawl $url" 120

      # Read result
      _job "python3 -c \"import json;d=json.load(open('/var/data/wh_result.json'));print(f'Status: {d.get(\\\"status\\\")}');print(f'Content: {d.get(\\\"content\\\",\\\"\\\")[:200]}...');print(f'Links: {d.get(\\\"links_count\\\",0)}');print(f'Time: {d.get(\\\"response_time\\\",0)}ms')\" 2>/dev/null || echo 'Could not read result'" \
           "read result" 90
      ;;

    map)
      title "🔗  INTEGRATION MAP"
      printf '  %s┌─────────────────────────────────────────────────┐%s\n' "$D" "$N"
      printf '  %s│%s            RENDER INTERNAL NETWORK              %s│%s\n' "$D" "$N" "$D" "$N"
      printf '  %s│%s                                                 %s│%s\n' "$D" "$N" "$D" "$N"
      printf '  %s│%s  %shermes-agent%s ─┬─▶ %swebhook-crawl4ai%s    %s✅%s   %s│%s\n' "$D" "$N" "$W" "$N" "$C" "$N" "$G" "$N" "$D" "$N"
      printf '  %s│%s  %s(singapore)%s   ├─▶ %scrawl4ai-mcp%s        %s✅%s   %s│%s\n' "$D" "$N" "$D" "$N" "$C" "$N" "$G" "$N" "$D" "$N"
      printf '  %s│%s               ├─▶ %slitellm%s             %s✅%s   %s│%s\n' "$D" "$N" "$C" "$N" "$G" "$N" "$D" "$N"
      printf '  %s│%s               ├─▶ %sclawrender%s          %s✅%s   %s│%s\n' "$D" "$N" "$C" "$N" "$G" "$N" "$D" "$N"
      printf '  %s│%s               └─▶ %scodex-master%s        %s✅%s   %s│%s\n' "$D" "$N" "$C" "$N" "$G" "$N" "$D" "$N"
      printf '  %s│%s                                                 %s│%s\n' "$D" "$N" "$D" "$N"
      printf '  %s│%s  External (Zapier/n8n/Make)  %s❌ 403 blocked%s   %s│%s\n' "$D" "$N" "$R" "$N" "$D" "$N"
      printf '  %s│%s  SSH Tunnel workaround       %s✅ localhost%s     %s│%s\n' "$D" "$N" "$G" "$N" "$D" "$N"
      printf '  %s└─────────────────────────────────────────────────┘%s\n\n' "$D" "$N"
      ;;

    *)
      printf '  %sUsage:%s  ./hermes.sh webhook {status|test|map}\n\n' "$W" "$N"
      printf '  %sstatus%s          Check connectivity + endpoints\n' "$C" "$N"
      printf '  %stest%s URL        Test crawl via webhook\n' "$C" "$N"
      printf '  %smap%s             Show integration diagram\n\n' "$C" "$N"
      ;;
  esac
}

# ═════════════════════════════════════════════════════════════════
#  run
# ═════════════════════════════════════════════════════════════════
cmd_run() {
  local prompt="${1:?Usage: hermes.sh run \"prompt\"}"
  title "🤖  RUN"
  printf '  %s%s%s\n\n' "$C" "${prompt:0:120}" "$N"
  local esc; esc=$(python3 -c "import shlex;print(shlex.quote('''$prompt'''))")
  _job "source /opt/hermes/.venv/bin/activate && HERMES_HOME=/var/data hermes chat -q $esc --model google/gemini-2.5-flash 2>&1 | tee /var/data/exports/run_latest.md" \
       "agent" 300
  printf '  %soutput → /var/data/exports/run_latest.md%s\n\n' "$D" "$N"
}

# ═════════════════════════════════════════════════════════════════
#  cron
# ═════════════════════════════════════════════════════════════════
cmd_cron() {
  local sub="${1:-list}"; shift 2>/dev/null || true
  case "$sub" in
    list)
      title "⏰  CRON JOBS"
      _job "cat /var/data/cron/jobs.json 2>/dev/null || echo '[]'" "read" 90 ;;
    add)
      local sched="${1:-0 */6 * * *}" prompt="${2:-Summarize latest AI news}" name="${3:-ai-digest}"
      title "⏰  ADD CRON: $name"
      printf '  schedule  %s%s%s\n  prompt    %s%s%s\n\n' "$C" "$sched" "$N" "$C" "$prompt" "$N"
      local jj; jj=$(python3 -c "import json,uuid;print(json.dumps({'id':uuid.uuid4().hex[:8],'name':'$name','schedule':'$sched','prompt':'''$prompt''','enabled':True,'skill':None,'toolsets':['terminal','web_search','file_operations']}))")
      local b64; b64=$(echo "$jj" | base64 -w0)
      _job "python3 -c \"import json,base64;j=json.loads(base64.b64decode('$b64'));
try: jobs=json.load(open('/var/data/cron/jobs.json'))
except: jobs=[]
jobs.append(j);json.dump(jobs,open('/var/data/cron/jobs.json','w'),indent=2);print(f'added {j[\\\"name\\\"]} — total {len(jobs)}')\"" "cron add" ;;
    *) echo "Usage: hermes.sh cron {list|add}" ;;
  esac
  echo
}

# ═════════════════════════════════════════════════════════════════
#  memory
# ═════════════════════════════════════════════════════════════════
cmd_memory() {
  local sub="${1:-read}"; shift 2>/dev/null || true
  title "🧠  MEMORY"
  case "$sub" in
    read) _job "echo '── MEMORY.md ──' && cat /var/data/memories/MEMORY.md 2>/dev/null && echo && echo '── USER.md ──' && cat /var/data/memories/USER.md 2>/dev/null || echo '(empty)'" "read" 90 ;;
    *) echo "Usage: hermes.sh memory {read|seed}" ;;
  esac
  echo
}

# ═════════════════════════════════════════════════════════════════
#  backup
# ═════════════════════════════════════════════════════════════════
cmd_backup() {
  title "💾  BACKUP"
  local ts; ts=$(date +%Y%m%d_%H%M%S)
  _job "B=/var/data/backups/full_$ts && mkdir -p \$B && cp /var/data/{config.yaml,.env,SOUL.md} \$B/ 2>/dev/null; cp -r /var/data/memories \$B/ 2>/dev/null; cp /var/data/cron/jobs.json \$B/ 2>/dev/null; cp /var/data/state.db \$B/ 2>/dev/null; du -sh \$B" "backup $ts"
  echo
}

# ═════════════════════════════════════════════════════════════════
#  env
# ═════════════════════════════════════════════════════════════════
cmd_env() {
  title "🔑  ENV VARS"
  _api "/services/$SVC_HERMES/env-vars" | python3 -c "
import json,sys
for i in json.load(sys.stdin):
  e=i.get('envVar',i); k,v=e['key'],e['value']
  if 'B64' in k: v='[base64]'
  elif len(v)>20 and any(x in k for x in ('KEY','TOKEN','AUTH','SECRET')): v=v[:10]+'…'+v[-4:]
  print(f'  {k:32s}  {v}')
" 2>/dev/null
  echo
}

# ═════════════════════════════════════════════════════════════════
#  jobs
# ═════════════════════════════════════════════════════════════════
cmd_jobs() {
  title "📦  JOBS"
  _api "/services/$SVC_HERMES/jobs?limit=${1:-10}" | python3 -c "
import json,sys
for j in json.load(sys.stdin):
  j=j.get('job',j)
  i={'succeeded':'✅','failed':'❌','running':'⏳','pending':'⏳'}.get(j['status'],'❓')
  f=j.get('finishedAt','running…')
  if f and f!='running…': f=f[:19]
  print(f'  {i}  {j[\"id\"]}  {j[\"status\"]:10s}  {f:20s}  {j[\"startCommand\"][:38]}')
" 2>/dev/null
  echo
}

# ═════════════════════════════════════════════════════════════════
#  main
# ═════════════════════════════════════════════════════════════════
case "${1:-help}" in
  chat)        cmd_chat "${2:-}" ;;
  setup)       cmd_setup ;;
  status)      cmd_status ;;
  scan)        cmd_scan "${2:-}" ;;
  deploy)      cmd_deploy ;;
  push-config) echo; cmd_push_config; echo ;;
  set-model)   cmd_set_model "${2:-}" ;;
  login)       shift; cmd_login "$@" ;;
  ssh)         shift; cmd_ssh "$@" ;;
  webhook)     shift; cmd_webhook "$@" ;;
  run)         cmd_run "${2:-}" ;;
  cron)        shift; cmd_cron "$@" ;;
  memory)      shift; cmd_memory "$@" ;;
  backup)      cmd_backup ;;
  env)         cmd_env ;;
  jobs)        cmd_jobs "${2:-10}" ;;
  help|-h|--help) cmd_help ;;
  *) printf '%s✗  Unknown: %s%s\n' "$R" "$1" "$N"; cmd_help; exit 1 ;;
esac
