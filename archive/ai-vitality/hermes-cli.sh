#!/data/data/com.termux/files/usr/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║                                                                           ║
# ║   ⚡ HERMES — Ultimate AI Agent CLI for Termux                           ║
# ║   v5.0.0 "Omni" — Full integration from 100 repositories                ║
# ║                                                                           ║
# ║   by Ivan Ssl (ivansslo)                                                  ║
# ║   Projects: Solace Hermes, RoadFX, AI-Vitality, Codex, CrewAI, ...       ║
# ║                                                                           ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -uo pipefail

VERSION="5.4.0"
CODENAME="Omni"

# ─── Paths ───────────────────────────────────────────────────────────────────
HERMES_DIR="${HERMES_DIR:-$HOME/.hermes}"
HERMES_KEYS="$HERMES_DIR/.keys"
HERMES_HISTORY="$HERMES_DIR/chat_history.json"
HERMES_CONFIG="$HERMES_DIR/config.env"
HERMES_WORKSPACE="$HERMES_DIR/workspace"

# ─── Gateway ─────────────────────────────────────────────────────────────────
GATEWAY="https://hermes-cloudflare.certveis.workers.dev"
GATEWAY_MIRROR="https://hermes-webhook.certveis.workers.dev"
GATEWAY_BACKUP="https://certve-webhook.certveis.workers.dev"
CF_AI="https://cf-ai.certveis.workers.dev"
LINKS_HUB="https://rocspace-links.certveis.workers.dev"
CLOUDRUN="https://ai-vitality-819208434965.us-west1.run.app"
ISDOCKER="https://isdocker-819208434965.us-west1.run.app"

# ─── AI Studio ───────────────────────────────────────────────────────────────
AI_STUDIO_URL="https://aistudio.google.com/apps/c19a9112-567a-45eb-9d90-af6e02e3c2ae"
AI_STUDIO_PROMPT_URL="https://aistudio.google.com/prompts/new_chat"

# ─── Firebase ────────────────────────────────────────────────────────────────
FIREBASE_PROJECT="rofai-agent"
FIREBASE_API_KEY="███████"
FIREBASE_AUTH_DOMAIN="rofai-agent.firebaseapp.com"
FIREBASE_STORAGE_BUCKET="rofai-agent.firebasestorage.app"
FIREBASE_MESSAGING_SENDER_ID="864507972707"
FIREBASE_APP_ID="1:864507972707:web:e6ff0fdab70f675fb17c56"
FIREBASE_MEASUREMENT_ID="G-3BD4H4VY4E"

# ─── GCP / Cloud Run ────────────────────────────────────────────────────────
GCP_PROJECT="819208434965"
GCP_REGION="us-west1"

# ─── GitHub ──────────────────────────────────────────────────────────────────
GH_USER="ivansslo"

# ─── Load keys ───────────────────────────────────────────────────────────────
mkdir -p "$HERMES_DIR"

# Load from saved files (these won't overwrite already-exported env vars)
_load_key() { [ -z "${!1:-}" ] && [ -n "${2:-}" ] && export "$1=$2"; }
if [ -f "$HERMES_KEYS" ]; then
  while IFS='=' read -r key val; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    val="${val%\"}" ; val="${val#\"}" ; val="${val%\'}" ; val="${val#\'}"
    _load_key "$key" "$val"
  done < "$HERMES_KEYS"
fi
[ -f "$HERMES_CONFIG" ] && source "$HERMES_CONFIG" 2>/dev/null

# Defaults (only set if still empty — preserves exported env vars)
TOKEN="${TOKEN:-}"
GROQ_KEY="${GROQ_KEY:-}"
OR_KEY="${OR_KEY:-}"
GEMINI_KEY="${GEMINI_KEY:-}"
CF_TOKEN="${CF_TOKEN:-}"
CF_AI_TOKEN="${CF_AI_TOKEN:-}"
CF_ACCOUNT="${CF_ACCOUNT:-}"
GITHUB_PAT="${GITHUB_PAT:-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}"
MONGO_URI="${MONGO_URI:-}"
VOYAGE_KEY="${VOYAGE_KEY:-}"
SOLACE_URL="${SOLACE_URL:-}"
ISDOCKER_GEMINI_KEY="${ISDOCKER_GEMINI_KEY:-AQ.Ab8RN6K7ZJCEkGVtIVU38jjbopXeJpITy84Vxzup0ZeoTfJIcA}"
MODEL="${MODEL:-llama-3.3-70b-versatile}"
PROVIDER="${PROVIDER:-groq}"

# ─── Auto-select model per provider ──────────────────────────────────────────
_default_model_for() {
  case "$1" in
    groq)         echo "llama-3.3-70b-versatile" ;;
    openrouter|or) echo "google/gemini-2.5-flash" ;;
    gemini)       echo "gemini-2.5-flash" ;;
    gateway)      echo "llama-3.3-70b-versatile" ;;
    cloudrun)     echo "llama-3.3-70b-versatile" ;;
    cf|cfai)      echo "@cf/meta/llama-3.3-70b-instruct-fp8-fast" ;;
    *)            echo "llama-3.3-70b-versatile" ;;
  esac
}
[ -z "$MODEL" ] && MODEL="$(_default_model_for "$PROVIDER")"

# ─── JSON-safe helper (avoids shell escaping issues) ─────────────────────────
json_escape() { python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))" <<< "$1"; }

# ─── Colors ──────────────────────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'
P='\033[0;35m'; C='\033[0;36m'; W='\033[1;37m'; D='\033[0;90m'; N='\033[0m'
BOLD='\033[1m'; DIM='\033[2m'

# ─── UI Helpers ──────────────────────────────────────────────────────────────
header() {
  clear 2>/dev/null || true
  echo -e "${B}╔══════════════════════════════════════════════════════════╗${N}"
  echo -e "${B}║  ${Y}⚡${B} HERMES ${DIM}v${VERSION} ${CODENAME}${B}                              ║${N}"
  echo -e "${B}║  ${D}Full AI Agent CLI — 100 repos integrated${B}              ║${N}"
  echo -e "${B}╚══════════════════════════════════════════════════════════╝${N}"
  echo ""
}

info()  { echo -e "  ${B}ℹ${N}  $1"; }
ok()    { echo -e "  ${G}✅${N} $1"; }
warn()  { echo -e "  ${Y}⚠️${N}  $1"; }
err()   { echo -e "  ${R}❌${N} $1"; }
dim()   { echo -e "  ${D}$1${N}"; }
spinner() { local p=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏'); printf "${C}%s${N} %s\r" "${p[$((RANDOM%10))]}" "$1"; }


# ─── Owner Access Control ─────────────────────────────────────────────────────
OWNER_EMAIL="${OWNER_EMAIL:-}"
OWNER_GITHUB="${OWNER_GITHUB:-ivansslo}"

check_owner_access() {
  # Check if running as owner
  if [ -n "$OWNER_EMAIL" ]; then
    # Verify email matches owner
    local current_user=$(git config user.email 2>/dev/null || echo "")
    if [ "$current_user" != "$OWNER_EMAIL" ]; then
      err "Access denied: This CLI is restricted to owner only"
      err "Owner: $OWNER_EMAIL"
      err "Current: $current_user"
      return 1
    fi
  fi
  
  # Check GitHub username
  if [ -n "$GITHUB_PAT" ]; then
    local github_user=$(curl -s -H "Authorization: token $GITHUB_PAT"       "https://api.github.com/user" 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('login',''))" 2>/dev/null)
    if [ "$github_user" != "$OWNER_GITHUB" ]; then
      err "Access denied: GitHub user mismatch"
      err "Expected: $OWNER_GITHUB"
      err "Current: $github_user"
      return 1
    fi
  fi
  
  return 0
}

# Run owner check on startup (unless disabled)
if [ "${DISABLE_OWNER_CHECK:-}" != "true" ]; then
  check_owner_access || exit 1
fi

# ─── API Call Helper ─────────────────────────────────────────────────────────
api_call() {
  local method="$1" url="$2" data="${3:-}" auth="${4:-Bearer $TOKEN}"
  local args=(-s --max-time 30 -X "$method" -H "Content-Type: application/json")
  [ -n "$auth" ] && args+=(-H "Authorization: $auth")
  [ -n "$data" ] && args+=(-d "$data")
  curl "${args[@]}" "$url" 2>/dev/null
}

# ═════════════════════════════════════════════════════════════════════════════
#  SETUP
# ═════════════════════════════════════════════════════════════════════════════
cmd_setup() {
  header
  echo -e "${BOLD}🔧 Interactive Setup${N}\n"
  echo -e "  ${D}Keys disimpan di $HERMES_KEYS${N}\n"

  read_input() {
    local label="$1" var="$2" default="${3:-}"
    local cur="${!var:-$default}"
    printf "  ${W}%s${N} " "$label"
    [ -n "$cur" ] && printf "${D}[%s]${N} " "${cur:0:20}..."
    read -r val
    val="${val:-$cur}"
    echo "${var}=${val}" >> "$HERMES_KEYS.tmp"
  }

  > "$HERMES_KEYS.tmp"
  read_input "Gateway Token" TOKEN "hk-rocspace-2026"
  read_input "Groq API Key" GROQ_KEY ""
  read_input "OpenRouter Key" OR_KEY ""
  read_input "Gemini Key" GEMINI_KEY ""
  read_input "GitHub PAT" GITHUB_PAT ""
  read_input "CF API Token" CF_TOKEN ""
  read_input "CF Account ID" CF_ACCOUNT "37c44b4d3f192a627d20e46bdf910e79"
  read_input "MongoDB URI" MONGO_URI ""
  read_input "Voyage AI Key" VOYAGE_KEY ""
  read_input "Solace URL" SOLACE_URL ""

  mv "$HERMES_KEYS.tmp" "$HERMES_KEYS"
  chmod 600 "$HERMES_KEYS"
  source "$HERMES_KEYS"

  echo ""
  ok "Keys saved to $HERMES_KEYS"
  ok "Run ${BOLD}hermes status${N} to verify connections"
}

# ═════════════════════════════════════════════════════════════════════════════
#  CONFIG
# ═════════════════════════════════════════════════════════════════════════════
cmd_config() {
  header
  echo -e "${BOLD}⚙️  Configuration${N}\n"
  echo -e "  ${W}Gateway:${N}     $GATEWAY"
  echo -e "  ${W}Mirror:${N}      $GATEWAY_MIRROR"
  echo -e "  ${W}Backup:${N}      $GATEWAY_BACKUP"
  echo -e "  ${W}CF AI:${N}       $CF_AI"
  echo -e "  ${W}Links Hub:${N}   $LINKS_HUB"
  echo -e "  ${W}Cloud Run:${N}   $CLOUDRUN"
  echo -e "  ${W}Firebase:${N}    $FIREBASE_PROJECT"
  echo -e "  ${W}AI Studio:${N}  $AI_STUDIO_URL"
  echo ""
  echo -e "  ${BOLD}Keys:${N}"
  for k in TOKEN GROQ_KEY OR_KEY GEMINI_KEY CF_TOKEN CF_ACCOUNT GITHUB_PAT MONGO_URI VOYAGE_KEY SOLACE_URL; do
    local v="${!k:-}"
    if [ -n "$v" ]; then
      printf "  ${G}✅${N} %-18s ${D}%s...${N}\n" "$k" "${v:0:16}"
    else
      printf "  ${R}❌${N} %-18s ${D}(not set)${N}\n" "$k"
    fi
  done
  echo ""
  echo -e "  ${W}Model:${N}    ${MODEL:-llama-3.3-70b-versatile}"
  echo -e "  ${W}Provider:${N} ${PROVIDER:-groq}"
}

# ═════════════════════════════════════════════════════════════════════════════
#  AI CHAT (Interactive)
# ═════════════════════════════════════════════════════════════════════════════
cmd_chat() {
  local provider="${2:-${PROVIDER:-groq}}"
  local model="${1:-${MODEL:-$(_default_model_for "$provider")}}"
  header
  echo -e "${BOLD}💬 AI Chat${N} — ${C}${model}${N} (${provider})"
  echo -e "  ${D}Type 'exit' to quit, '/model <name>' to switch, '/save' to save${N}\n"

  local messages="[]"
  local system_prompt="${SYSTEM:-You are Hermes, an advanced AI assistant. Be concise, helpful, and accurate.}"

  while true; do
    printf "${G}You>${N} "
    read -r input
    [ -z "$input" ] && continue
    [ "$input" = "exit" ] || [ "$input" = "quit" ] && break

    # Commands
    if [[ "$input" == /model* ]]; then
      model="${input#/model }"
      echo -e "  ${C}Model → $model${N}"
      continue
    fi
    if [[ "$input" == /provider* ]]; then
      provider="${input#/provider }"
      echo -e "  ${C}Provider → $provider${N}"
      continue
    fi
    if [[ "$input" == /system* ]]; then
      system_prompt="${input#/system }"
      echo -e "  ${C}System prompt updated${N}"
      continue
    fi
    if [[ "$input" == /clear ]]; then
      messages="[]"
      echo -e "  ${C}Chat cleared${N}"
      continue
    fi
    if [[ "$input" == /save ]]; then
      echo "$messages" > "$HERMES_DIR/chat_$(date +%s).json"
      ok "Chat saved"
      continue
    fi

    # Add user message (safe JSON via python3)
    messages=$(python3 -c "
import json,sys
msgs = json.loads(sys.argv[1])
msgs.append({'role':'user','content':sys.argv[2]})
print(json.dumps(msgs))
" "$messages" "$input" 2>/dev/null || echo "$messages")

    # Call API
    printf "${Y}AI>${N} "
    local response=""

    case "$provider" in
      groq)
        response=$(api_call POST "https://api.groq.com/openai/v1/chat/completions" \
          "{\"model\":\"$model\",\"messages\":$messages,\"max_tokens\":4096,\"temperature\":0.7}" \
          "Bearer $GROQ_KEY")
        ;;
      openrouter|or)
        response=$(api_call POST "https://openrouter.ai/api/v1/chat/completions" \
          "{\"model\":\"$model\",\"messages\":$messages,\"max_tokens\":4096}" \
          "Bearer $OR_KEY")
        ;;
      gemini)
        local gemini_msgs=$(python3 -c "
import json,sys
msgs = json.loads(sys.argv[1])
sys_prompt = sys.argv[2]
parts = []
for m in msgs:
    r = 'model' if m['role']=='assistant' else 'user'
    parts.append({'role':r,'parts':[{'text':m['content']}]})
body = {'contents':parts,'generationConfig':{'temperature':0.7,'maxOutputTokens':4096}}
if sys_prompt:
    body['systemInstruction'] = {'parts':[{'text':sys_prompt}]}
print(json.dumps(body))
" "$messages" "$system_prompt" 2>/dev/null)
        response=$(api_call POST \
          "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$GEMINI_KEY" \
          "$gemini_msgs" "")
        # Parse Gemini response
        local content=$(echo "$response" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    print(d['candidates'][0]['content']['parts'][0]['text'])
except: print('Error: ' + str(sys.stdin.read())[:200])
" 2>/dev/null)
        echo "$content"
        # Add to messages for context (safe JSON)
        messages=$(python3 -c "
import json,sys
msgs = json.loads(sys.argv[1])
msgs.append({'role':'assistant','content':sys.argv[2]})
print(json.dumps(msgs))
" "$messages" "$content" 2>/dev/null || echo "$messages")
        echo ""
        continue
        ;;
      gateway)
        response=$(api_call POST "$GATEWAY/ai/chat" \
          "{\"model\":\"$model\",\"messages\":$messages,\"max_tokens\":4096}" \
          "Bearer $TOKEN")
        ;;
      cloudrun)
        response=$(api_call POST "$CLOUDRUN/ai/chat" \
          "{\"model\":\"$model\",\"messages\":$messages,\"max_tokens\":4096}" \
          "Bearer $TOKEN")
        ;;
      cf|cfai)
        response=$(api_call POST "$CF_AI/chat" \
          "{\"model\":\"@cf/meta/llama-3.3-70b-instruct-fp8-fast\",\"messages\":$messages}" \
          "Bearer $TOKEN")
        ;;
    esac

    # Parse OpenAI-compatible response
    local content=$(echo "$response" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    print(d['choices'][0]['message']['content'])
except Exception as e:
    print('Error: ' + str(e))
" 2>/dev/null || echo "$response" | head -c 500)

    echo "$content"
    echo ""

    # Add assistant message to context (safe JSON)
    messages=$(python3 -c "
import json,sys
msgs = json.loads(sys.argv[1])
msgs.append({'role':'assistant','content':sys.argv[2]})
print(json.dumps(msgs))
" "$messages" "$content" 2>/dev/null || echo "$messages")
  done
}

# ═════════════════════════════════════════════════════════════════════════════
#  QUICK ASK (non-interactive)
# ═════════════════════════════════════════════════════════════════════════════
cmd_ask() {
  local question="$*"
  [ -z "$question" ] && { err "Usage: hermes ask <question>"; return 1; }

  local provider="${PROVIDER:-groq}"
  local model="${MODEL:-$(_default_model_for "$provider")}"
  local safe_q
  safe_q=$(json_escape "$question")

  case "$provider" in
    gemini)
      local resp=$(curl -s --max-time 20 -X POST \
        "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$GEMINI_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"contents\":[{\"parts\":[{\"text\":$safe_q}]}],\"generationConfig\":{\"maxOutputTokens\":4096}}")
      echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['candidates'][0]['content']['parts'][0]['text'])" 2>/dev/null || echo "$resp" | head -c 500
      ;;
    openrouter|or)
      local resp=$(api_call POST "https://openrouter.ai/api/v1/chat/completions" \
        "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":$safe_q}],\"max_tokens\":4096}" \
        "Bearer $OR_KEY")
      echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'])" 2>/dev/null || echo "$resp" | head -c 500
      ;;
    gateway)
      local resp=$(api_call POST "$GATEWAY/v1/chat/completions" \
        "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":$safe_q}],\"max_tokens\":4096}" \
        "Bearer $TOKEN")
      echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'])" 2>/dev/null || echo "$resp" | head -c 500
      ;;
    *)
      # Groq (default)
      local resp=$(api_call POST "https://api.groq.com/openai/v1/chat/completions" \
        "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":$safe_q}],\"max_tokens\":4096}" \
        "Bearer $GROQ_KEY")
      echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'])" 2>/dev/null || echo "$resp" | head -c 500
      ;;
  esac
}

# ─── Internal Ask (used by coding and other commands) ────────────────────────
cmd_ask_internal() {
  local question="$1"
  local system="${2:-You are an expert programmer.}"
  local provider="${PROVIDER:-groq}"
  local model="${MODEL:-$(_default_model_for "$provider")}"
  local safe_q
  safe_q=$(json_escape "$question")
  local safe_sys
  safe_sys=$(json_escape "$system")

  local resp=""
  case "$provider" in
    gemini)
      resp=$(curl -s --max-time 30 -X POST \
        "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$GEMINI_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"contents\":[{\"parts\":[{\"text\":$safe_q}]}],\"systemInstruction\":{\"parts\":[{\"text\":$safe_sys}]},\"generationConfig\":{\"maxOutputTokens\":8192,\"temperature\":0.3}}")
      echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['candidates'][0]['content']['parts'][0]['text'])" 2>/dev/null || echo "$resp" | head -c 1000
      ;;
    *)
      resp=$(api_call POST "https://api.groq.com/openai/v1/chat/completions" \
        "{\"model\":\"$model\",\"messages\":[{\"role\":\"system\",\"content\":$safe_sys},{\"role\":\"user\",\"content\":$safe_q}],\"max_tokens\":8192,\"temperature\":0.3}" \
        "Bearer $GROQ_KEY")
      echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'])" 2>/dev/null || echo "$resp" | head -c 1000
      ;;
  esac
}

# ═════════════════════════════════════════════════════════════════════════════
#  INTERACTIVE CODING ASSISTANT
# ═════════════════════════════════════════════════════════════════════════════
cmd_coding() {
  header
  echo -e "${BOLD}⌘ Coding Assistant${N} — Interactive mode"
  echo -e "  ${D}Commands:${N}"
  echo -e "    ${C}/run${N}           Run current code (Python/Node/Bash)"
  echo -e "    ${C}/debug${N}         AI debug current code"
  echo -e "    ${C}/refactor${N}      AI refactor current code"
  echo -e "    ${C}/explain${N}       AI explain current code"
  echo -e "    ${C}/test${N}          AI generate tests"
  echo -e "    ${C}/fix${N}           AI fix errors in code"
  echo -e "    ${C}/file <name>${N}   Load file into context"
  echo -e "    ${C}/save <name>${N}   Save code to file"
  echo -e "    ${C}/lang <lang>${N}   Set language (python/node/bash/go/rust)"
  echo -e "    ${C}/clear${N}         Clear context"
  echo -e "    ${C}/exit${N}          Exit coding mode"
  echo -e "    ${D}# comment${N}      Skip line (not sent to AI)"
  echo ""

  local context=""
  local filename=""
  local lang="python"
  local history="[]"

  while true; do
    if [ -n "$filename" ]; then
      printf "${C}⌘${N} ${D}[%s]${N} ${C}>${N} " "$filename"
    else
      printf "${C}⌘${N} ${C}>${N} "
    fi
    read -r input
    [ -z "$input" ] && continue
    [ "$input" = "/exit" ] || [ "$input" = "/quit" ] && break

    # Skip comments
    [[ "$input" == \#* ]] && continue

    # Commands
    case "$input" in
      /clear)
        context=""
        filename=""
        history="[]"
        echo -e "  ${G}✓${N} Context cleared"
        continue
        ;;
      /lang*)
        lang="${input#/lang }"
        [ "$lang" = "/lang" ] && lang="python"
        echo -e "  ${C}Language → $lang${N}"
        continue
        ;;
      /file*)
        local load_file="${input#/file }"
        if [ -f "$load_file" ]; then
          context=$(cat "$load_file")
          filename="$load_file"
          local lines=$(wc -l < "$load_file")
          echo -e "  ${G}✓${N} Loaded: $load_file ($lines lines)"
          # Detect language
          case "$load_file" in
            *.py) lang="python" ;;
            *.js|*.ts|*.jsx|*.tsx) lang="node" ;;
            *.sh|*.bash) lang="bash" ;;
            *.go) lang="go" ;;
            *.rs) lang="rust" ;;
            *.java) lang="java" ;;
          esac
          echo -e "  ${D}Detected: $lang${N}"
        else
          echo -e "  ${R}✗${N} File not found: $load_file"
        fi
        continue
        ;;
      /save*)
        local save_file="${input#/save }"
        [ "$save_file" = "/save" ] && save_file="${filename:-output_$(date +%s).txt}"
        if [ -z "$context" ]; then
          echo -e "  ${R}✗${N} No code to save"
        else
          echo "$context" > "$save_file"
          filename="$save_file"
          echo -e "  ${G}✓${N} Saved to $save_file"
        fi
        continue
        ;;
      /run)
        if [ -z "$context" ]; then
          echo -e "  ${R}✗${N} No code to run. Write or /file first."
          continue
        fi
        echo -e "  ${Y}▶ Running ($lang)...${N}"
        echo ""
        case "$lang" in
          python|py)
            echo "$context" | python3 2>&1 | sed 's/^/    /'
            ;;
          node|js|javascript)
            echo "$context" | node 2>&1 | sed 's/^/    /'
            ;;
          bash|sh)
            echo "$context" | bash 2>&1 | sed 's/^/    /'
            ;;
          go)
            local tmpgo="/tmp/hermes_run_$$.go"
            echo "$context" > "$tmpgo"
            go run "$tmpgo" 2>&1 | sed 's/^/    /'
            rm -f "$tmpgo"
            ;;
          *)
            echo -e "  ${Y}⚠${N} Cannot run $lang directly. Use /save then run manually."
            ;;
        esac
        echo ""
        continue
        ;;
      /debug)
        if [ -z "$context" ]; then
          echo -e "  ${R}✗${N} No code to debug"
          continue
        fi
        echo -e "  ${Y}🔍 Debugging...${N}"
        echo ""
        local debug_prompt="Debug this $lang code. Find bugs, logic errors, performance issues, and security problems. Be specific with line references:\n\n\`\`\`$lang\n$context\n\`\`\`"
        local response=$(cmd_ask_internal "$debug_prompt" "You are a senior $lang developer and code reviewer. Be precise and actionable.")
        echo "$response"
        echo ""
        continue
        ;;
      /refactor)
        if [ -z "$context" ]; then
          echo -e "  ${R}✗${N} No code to refactor"
          continue
        fi
        echo -e "  ${Y}♻️  Refactoring...${N}"
        echo ""
        local refactor_prompt="Refactor this $lang code for better readability, performance, and maintainability. Show the refactored code:\n\n\`\`\`$lang\n$context\n\`\`\`"
        local response=$(cmd_ask_internal "$refactor_prompt" "You are a senior $lang developer. Output clean refactored code in a code block.")
        echo "$response"
        # Extract and offer to replace
        local new_code=$(echo "$response" | python3 -c "
import sys,re
content = sys.stdin.read()
blocks = re.findall(r'\`\`\`\w*\n(.*?)\`\`\`', content, re.DOTALL)
if blocks: print(blocks[0].strip())
" 2>/dev/null)
        if [ -n "$new_code" ]; then
          echo ""
          printf "  ${D}Replace context with refactored code? [y/N]:${N} "
          read -r confirm
          if [[ "$confirm" =~ ^[Yy]$ ]]; then
            context="$new_code"
            echo -e "  ${G}✓${N} Context updated with refactored code"
          fi
        fi
        echo ""
        continue
        ;;
      /explain)
        if [ -z "$context" ]; then
          echo -e "  ${R}✗${N} No code to explain"
          continue
        fi
        echo -e "  ${Y}📖 Explaining...${N}"
        echo ""
        local explain_prompt="Explain this $lang code step by step in simple terms:\n\n\`\`\`$lang\n$context\n\`\`\`"
        cmd_ask_internal "$explain_prompt" "You are a patient coding teacher. Explain clearly for beginners."
        echo ""
        continue
        ;;
      /test)
        if [ -z "$context" ]; then
          echo -e "  ${R}✗${N} No code to test"
          continue
        fi
        echo -e "  ${Y}🧪 Generating tests...${N}"
        echo ""
        local test_prompt="Generate comprehensive unit tests for this $lang code. Include edge cases:\n\n\`\`\`$lang\n$context\n\`\`\`"
        cmd_ask_internal "$test_prompt" "You are a QA engineer. Write thorough tests with good coverage."
        echo ""
        continue
        ;;
      /fix)
        if [ -z "$context" ]; then
          echo -e "  ${R}✗${N} No code to fix"
          continue
        fi
        echo -e "  ${Y}🔧 Fixing...${N}"
        echo ""
        local fix_prompt="Fix all errors and issues in this $lang code. Show the corrected code:\n\n\`\`\`$lang\n$context\n\`\`\`"
        local response=$(cmd_ask_internal "$fix_prompt" "You are a senior $lang developer. Fix all bugs and output corrected code in a code block.")
        echo "$response"
        local fixed_code=$(echo "$response" | python3 -c "
import sys,re
content = sys.stdin.read()
blocks = re.findall(r'\`\`\`\w*\n(.*?)\`\`\`', content, re.DOTALL)
if blocks: print(blocks[0].strip())
" 2>/dev/null)
        if [ -n "$fixed_code" ]; then
          echo ""
          printf "  ${D}Replace context with fixed code? [y/N]:${N} "
          read -r confirm
          if [[ "$confirm" =~ ^[Yy]$ ]]; then
            context="$fixed_code"
            echo -e "  ${G}✓${N} Context updated with fixed code"
          fi
        fi
        echo ""
        continue
        ;;
    esac

    # Regular input → AI coding request
    local full_prompt="$input"
    if [ -n "$context" ]; then
      full_prompt="Current $lang code:\n\`\`\`$lang\n$context\n\`\`\`\n\nUser request: $input"
    fi

    local response=$(cmd_ask_internal "$full_prompt" "You are an expert $lang programmer. Provide clean, efficient code with explanations. Use markdown code blocks.")
    
    echo ""
    echo "$response"
    echo ""

    # Extract code block if present
    local extracted=$(echo "$response" | python3 -c "
import sys,re
content = sys.stdin.read()
blocks = re.findall(r'\`\`\`\w*\n(.*?)\`\`\`', content, re.DOTALL)
if blocks: print(blocks[0].strip())
" 2>/dev/null)

    if [ -n "$extracted" ] && [ -t 0 ]; then
      printf "  ${D}Use this code as context? [y/N]:${N} "
      read -r use_code
      if [[ "$use_code" =~ ^[Yy]$ ]]; then
        context="$extracted"
        echo -e "  ${G}✓${N} Context updated"
      fi
    fi
    echo ""
  done
}

# ─── Code Generation (non-interactive) ──────────────────────────────────────
cmd_code() {
  local prompt="$*"
  [ -z "$prompt" ] && { err "Usage: hermes code <description>"; return 1; }

  header
  echo -e "${BOLD}⌘ Code Generation${N} — ${C}${MODEL:-llama-3.3-70b-versatile}${N}\n"
  info "Generating code for: $prompt"
  echo ""

  local system="You are an expert programmer. Generate clean, production-ready code. Include comments. Output ONLY code in a code block, no explanations unless asked."
  local full_prompt="Generate code for: $prompt"

  local safe_prompt
  safe_prompt=$(json_escape "$full_prompt")
  local safe_system
  safe_system=$(json_escape "$system")

  local resp=""
  if [ "$PROVIDER" = "gemini" ]; then
    # Gemini format
    resp=$(curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/${MODEL:-gemini-flash-latest}:generateContent?key=$GEMINI_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"contents\":[{\"parts\":[{\"text\":$safe_prompt}]}],\"generationConfig\":{\"temperature\":0.3,\"maxOutputTokens\":8192}}")
  else
    # OpenAI-compatible format
    resp=$(api_call POST "https://api.groq.com/openai/v1/chat/completions" \
      "{\"model\":\"${MODEL:-llama-3.3-70b-versatile}\",\"messages\":[{\"role\":\"system\",\"content\":$safe_system},{\"role\":\"user\",\"content\":$safe_prompt}],\"max_tokens\":8192,\"temperature\":0.3}" \
      "Bearer $GROQ_KEY")
  fi

  local code=$(echo "$resp" | python3 -c "
import json,sys,re
try:
    d=json.load(sys.stdin)
    # Handle both Gemini and OpenAI formats
    if 'candidates' in d:
        content=d['candidates'][0]['content']['parts'][0]['text']
    else:
        content=d['choices'][0]['message']['content']
    # Extract code blocks
    blocks=re.findall(r'\`\`\`\w*\n(.*?)\`\`\`', content, re.DOTALL)
    if blocks:
        print(blocks[0])
    else:
        print(content)
except Exception as e:
    print('Error: '+str(e))
" 2>/dev/null)

  echo "$code"
  echo ""

  # Save option (skip if non-interactive)
  if [ -t 0 ]; then
    printf "  ${D}Save to file? [filename or Enter to skip]:${N} "
    read -r fname
    if [ -n "$fname" ]; then
      echo "$code" > "$fname"
      ok "Saved to $fname"
    fi
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
#  WEB CRAWL
# ═════════════════════════════════════════════════════════════════════════════
cmd_crawl() {
  local url="$1"
  [ -z "$url" ] && { err "Usage: hermes crawl <url>"; return 1; }

  header
  echo -e "${BOLD}🕷️ Crawl4AI${N} — $url\n"
  info "Crawling..."

  local resp=$(api_call POST "$GATEWAY/crawl4ai" \
    "{\"url\":\"$url\",\"max_length\":50000}" \
    "Bearer $TOKEN")

  echo "$resp" | python3 -m json.tool 2>/dev/null || echo "$resp" | head -c 5000
  echo ""

  # Save option (skip if non-interactive)
  if [ -t 0 ]; then
    printf "  ${D}Save to file? [filename or Enter to skip]:${N} "
    read -r fname
    if [ -n "$fname" ]; then
      echo "$resp" > "$fname"
      ok "Saved to $fname"
    fi
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
#  CREWAI MULTI-AGENT
# ═════════════════════════════════════════════════════════════════════════════
cmd_crew() {
  local topic="${*:-AI agents in 2026}"
  header
  echo -e "${BOLD}🤖 CrewAI Multi-Agent${N}\n"
  info "Topic: $topic"
  info "Agents: Researcher → Analyst → Writer"
  info "Sending to Hermes Gateway..."
  echo ""

  local safe_topic
  safe_topic=$(json_escape "You are a research crew. Research, analyze, and write a comprehensive report about: $topic. Structure: 1) Key Findings, 2) Analysis, 3) Recommendations.")

  local resp=$(api_call POST "$GATEWAY/solace/task" \
    "{\"type\":\"chat\",\"prompt\":$safe_topic,\"model\":\"llama-3.3-70b-versatile\",\"max_tokens\":4096}" \
    "Bearer $TOKEN")

  echo "$resp" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    c=d.get('choices',[{}])[0].get('message',{}).get('content','')
    if c: print(c)
    else: print(json.dumps(d,indent=2)[:3000])
except: print(sys.stdin.read()[:3000])
" 2>/dev/null || echo "$resp" | head -c 3000
}

# ═════════════════════════════════════════════════════════════════════════════
#  VOYAGE AI EMBEDDINGS
# ═════════════════════════════════════════════════════════════════════════════
cmd_embed() {
  local text="$*"
  [ -z "$text" ] && { err "Usage: hermes embed <text>"; return 1; }
  [ -z "$VOYAGE_KEY" ] && { err "VOYAGE_KEY not set. Run: hermes setup"; return 1; }

  header
  echo -e "${BOLD}🧠 Voyage AI Embedding${N}\n"
  info "Generating embedding..."

  local resp=$(curl -s --max-time 15 -X POST "https://api.voyageai.com/v1/embeddings" \
    -H "Authorization: Bearer $VOYAGE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"voyage-3-lite\",\"input\":[\"$text\"]}")

  echo "$resp" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if 'data' in d:
    emb=d['data'][0]['embedding']
    print(f'  Dimensions: {len(emb)}')
    print(f'  Model: voyage-3-lite')
    print(f'  First 5 values: {emb[:5]}')
    print(f'  Text: {sys.argv[1][:80]}...')
else:
    print('  Error: ' + json.dumps(d)[:200])
" "$text" 2>/dev/null
}

# ═════════════════════════════════════════════════════════════════════════════
#  FIREBASE
# ═════════════════════════════════════════════════════════════════════════════
cmd_firebase() {
  local action="${1:-status}"
  header
  echo -e "${BOLD}🔥 Firebase — ${FIREBASE_PROJECT}${N}\n"

  case "$action" in
    status)
      echo -e "  ${Y}── Project Info ──${N}"
      echo -e "    Project ID:      ${C}${FIREBASE_PROJECT}${N}"
      echo -e "    Auth Domain:     ${FIREBASE_AUTH_DOMAIN}"
      echo -e "    Storage Bucket:  ${FIREBASE_STORAGE_BUCKET}"
      echo -e "    App ID:          ${FIREBASE_APP_ID}"
      echo -e "    Analytics:       ${FIREBASE_MEASUREMENT_ID}"
      echo ""
      echo -e "  ${Y}── Firestore Data ──${N}"
      local resp=$(curl -s --max-time 10 "https://firestore.googleapis.com/v1/projects/$FIREBASE_PROJECT/databases/(default)/documents?pageSize=5&key=$FIREBASE_API_KEY" 2>/dev/null)
      echo "$resp" | python3 -c "
import json,sys
d=json.load(sys.stdin)
docs=d.get('documents',[])
if docs:
    print(f'  Found {len(docs)} documents:')
    for doc in docs[:5]:
        name=doc.get('name','').split('/')[-1]
        print(f'    📄 {name}')
else:
    print('  No documents found (or access denied)')
" 2>/dev/null || warn "Cannot reach Firestore"
      echo ""
      echo -e "  ${Y}── Quick Commands ──${N}"
      echo -e "    ${BOLD}hermes firebase save <msg>${N}    Save to Firestore"
      echo -e "    ${BOLD}hermes firebase deploy${N}        Deploy to Hosting"
      echo -e "    ${BOLD}hermes firebase config${N}        Show web config"
      ;;
    save)
      shift
      local msg="$*"
      [ -z "$msg" ] && { err "Usage: hermes firebase save <message>"; return 1; }
      local resp=$(curl -s --max-time 10 -X POST \
        "https://firestore.googleapis.com/v1/projects/$FIREBASE_PROJECT/databases/(default)/documents/chats?key=$FIREBASE_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"fields\":{\"sender\":{\"stringValue\":\"hermes-cli\"},\"text\":{\"stringValue\":\"$msg\"},\"timestamp\":{\"timestampValue\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}}")
      echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ✅ Saved:', d.get('name','unknown').split('/')[-1])" 2>/dev/null
      ;;
    deploy)
      echo -e "  ${B}Deploying to Firebase Hosting...${N}\n"
      if ! command -v firebase &>/dev/null; then
        warn "Firebase CLI not installed"
        echo -e "  ${D}Install: npm install -g firebase-tools${N}"
        return 1
      fi
      cd "$HERMES_WORKSPACE" 2>/dev/null || { err "Workspace not found"; return 1; }
      firebase deploy --project "$FIREBASE_PROJECT" 2>&1 | sed 's/^/    /'
      ;;
    config)
      echo -e "  ${Y}── Firebase Web Config ──${N}\n"
      cat << EOF
const firebaseConfig = {
  apiKey: "${FIREBASE_API_KEY}",
  authDomain: "${FIREBASE_AUTH_DOMAIN}",
  projectId: "${FIREBASE_PROJECT}",
  storageBucket: "${FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${FIREBASE_APP_ID}",
  measurementId: "${FIREBASE_MEASUREMENT_ID}"
};
EOF
      ;;
    *)
      echo -e "  ${W}Commands:${N} status, save <message>, deploy, config"
      ;;
  esac
}

# ═════════════════════════════════════════════════════════════════════════════
#  MODELS
# ═════════════════════════════════════════════════════════════════════════════
cmd_models() {
  header
  echo -e "${BOLD}📦 Available Models${N}\n"

  echo -e "  ${Y}⚡ Groq (Free, Ultra-Fast):${N}"
  for m in "llama-3.3-70b-versatile" "qwen/qwen3-32b" "qwen/qwen3.6-27b" "meta-llama/llama-4-scout-17b-16e-instruct" "openai/gpt-oss-120b" "groq/compound" "llama-3.1-8b-instant"; do
    printf "    %-45s" "$m"
    if [ -n "$GROQ_KEY" ]; then
      local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
        -H "Authorization: Bearer $GROQ_KEY" -H "Content-Type: application/json" \
        -d "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"max_tokens\":1}" \
        "https://api.groq.com/openai/v1/chat/completions" 2>/dev/null)
      [ "$code" = "200" ] && echo -e "${G}✅${N}" || echo -e "${R}❌ $code${N}"
    else
      echo -e "${D}(no key)${N}"
    fi
  done

  echo ""
  echo -e "  ${B}🌐 OpenRouter:${N}"
  for m in "google/gemini-2.5-flash" "google/gemini-2.5-pro-preview" "openai/gpt-4o" "anthropic/claude-sonnet-4-5" "deepseek/deepseek-r1"; do
    printf "    %-45s" "$m"
    [ -n "$OR_KEY" ] && echo -e "${G}available${N}" || echo -e "${D}(no key)${N}"
  done

  echo ""
  echo -e "  ${G}💎 Gemini (Direct):${N}"
  for m in "gemini-2.5-flash" "gemini-2.5-pro" "gemini-2.0-flash" "gemini-1.5-pro"; do
    printf "    %-45s" "$m"
    [ -n "$GEMINI_KEY" ] && echo -e "${G}available${N}" || echo -e "${D}(no key)${N}"
  done
}

# ═════════════════════════════════════════════════════════════════════════════
#  STATUS — Full System Check
# ═════════════════════════════════════════════════════════════════════════════
cmd_status() {
  header
  echo -e "${BOLD}📊 System Status${N}\n"

  echo -e "  ${Y}Cloudflare Workers:${N}"
  for entry in \
    "hermes-cloudflare|$GATEWAY/dashboard/status" \
    "hermes-webhook|$GATEWAY_MIRROR/" \
    "certve-webhook|$GATEWAY_BACKUP/" \
    "cf-ai-factory|$CF_AI/models" \
    "rocspace-links|$LINKS_HUB/"; do
    local name="${entry%%|*}"
    local url="${entry##*|}"
    local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null)
    [ "$code" = "200" ] && printf "    ${G}✅${N} %-25s HTTP %s\n" "$name" "$code" || printf "    ${R}❌${N} %-25s HTTP %s\n" "$name" "$code"
  done

  echo ""
  echo -e "  ${B}Cloud Run:${N}"
  local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$CLOUDRUN/health" 2>/dev/null)
  [ "$code" = "200" ] && printf "    ${G}✅${N} %-25s HTTP %s\n" "ai-vitality" "$code" || printf "    ${R}❌${N} %-25s HTTP %s\n" "ai-vitality" "$code"

  echo ""
  echo -e "  ${G}AI Providers:${N}"
  [ -n "$GROQ_KEY" ] && printf "    ${G}✅${N} Groq\n" || printf "    ${R}❌${N} Groq (no key)\n"
  [ -n "$OR_KEY" ] && printf "    ${G}✅${N} OpenRouter\n" || printf "    ${R}❌${N} OpenRouter (no key)\n"
  [ -n "$GEMINI_KEY" ] && printf "    ${G}✅${N} Gemini\n" || printf "    ${R}❌${N} Gemini (no key)\n"
  [ -n "$VOYAGE_KEY" ] && printf "    ${G}✅${N} Voyage AI\n" || printf "    ${R}❌${N} Voyage AI (no key)\n"

  echo ""
  echo -e "  ${P}Infrastructure:${N}"
  [ -n "$GITHUB_PAT" ] && printf "    ${G}✅${N} GitHub PAT\n" || printf "    ${R}❌${N} GitHub PAT\n"
  [ -n "$CF_TOKEN" ] && printf "    ${G}✅${N} Cloudflare API\n" || printf "    ${R}❌${N} Cloudflare API\n"
  [ -n "$MONGO_URI" ] && printf "    ${G}✅${N} MongoDB\n" || printf "    ${R}❌${N} MongoDB\n"
  [ -n "$SOLACE_URL" ] && printf "    ${G}✅${N} Solace\n" || printf "    ${R}❌${N} Solace (not configured)\n"
  printf "    ${G}✅${N} Firebase ($FIREBASE_PROJECT)\n"
}

# ═════════════════════════════════════════════════════════════════════════════
#  DEPLOY to Cloudflare Workers
# ═════════════════════════════════════════════════════════════════════════════
cmd_deploy() {
  local target="${1:-hermes-cloudflare}"
  header
  echo -e "${BOLD}🚀 Deploy to Cloudflare Workers${N}\n"
  info "Target: $target"

  if ! command -v npx &>/dev/null; then
    err "npx not found. Run: hermes install-deps"
    return 1
  fi

  local workers=("hermes-cloudflare" "hermes-webhook" "certve-webhook" "cf-ai-factory" "rocspace-links")
  if [[ ! " ${workers[*]} " =~ " $target " ]] && [ "$target" != "all" ]; then
    err "Unknown worker: $target"
    echo -e "  Available: ${workers[*]}"
    echo -e "  Use: hermes deploy all"
    return 1
  fi

  if [ "$target" = "all" ]; then
    info "Deploying to ALL existing workers..."
    echo ""
  fi

  echo -e "  ${D}Workers will NOT be created — deploying to existing ones${N}\n"
  echo -e "  ${Y}Run:${N} npx wrangler deploy --name $target"
  echo ""
  warn "Make sure you're in the cloudflare-gateway directory with worker.js"
}

# ═════════════════════════════════════════════════════════════════════════════
#  CLONE / SYNC Repos
# ═════════════════════════════════════════════════════════════════════════════
cmd_clone() {
  local repo="${1:-}"
  header
  echo -e "${BOLD}📦 Clone/Sync Repos${N}\n"

  if [ -z "$repo" ]; then
    echo -e "  ${W}Key repositories:${N}\n"
    local repos=(
      "Solace-Hermes-Project:Main gateway (CF Workers)"
      "roadfx-full-stack:Full-stack platform + Firebase"
      "roadfx-ai-stack:Backup (newest UI)"
      "ai-vitality:AI Studio app (2 branches)"
      "hermes-agent-cli:Termux CLI installer"
      "codex-master-ai-api:15+ models API"
      "solace-crewai-cli:CrewAI CLI"
      "hermes-agent:Python agent framework"
      "crawl4ai:Web crawler"
      "droid-ai-toolkit:Android AI toolkit"
    )
    for entry in "${repos[@]}"; do
      local name="${entry%%:*}"
      local desc="${entry##*:}"
      printf "    ${C}%-30s${N} %s\n" "$name" "$desc"
    done
    echo ""
    echo -e "  ${D}Usage: hermes clone <repo-name>${N}"
    echo -e "  ${D}       hermes clone all${N}"
    return 0
  fi

  if [ -z "$GITHUB_PAT" ]; then
    err "GITHUB_PAT not set. Run: hermes setup"
    return 1
  fi

  if [ "$repo" = "all" ]; then
    local all_repos=("Solace-Hermes-Project" "roadfx-full-stack" "roadfx-ai-stack" "ai-vitality" "hermes-agent-cli" "codex-master-ai-api" "solace-crewai-cli")
    for r in "${all_repos[@]}"; do
      info "Cloning $r..."
      git clone --depth 1 "https://x-access-token:${GITHUB_PAT}@github.com/${GH_USER}/${r}.git" "$HERMES_WORKSPACE/$r" 2>/dev/null && ok "$r cloned" || warn "$r failed or exists"
    done
  else
    info "Cloning $repo..."
    mkdir -p "$HERMES_WORKSPACE"
    git clone --depth 1 "https://x-access-token:${GITHUB_PAT}@github.com/${GH_USER}/${repo}.git" "$HERMES_WORKSPACE/$repo" 2>/dev/null && ok "$repo cloned to $HERMES_WORKSPACE/$repo" || warn "Failed or already exists"
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
#  PUSH to GitHub
# ═════════════════════════════════════════════════════════════════════════════
cmd_push() {
  local dir="${1:-.}"
  local msg="${2:-update from hermes CLI v$VERSION}"
  header
  echo -e "${BOLD}📤 Push to GitHub${N}\n"

  cd "$dir" || { err "Cannot cd to $dir"; return 1; }

  if [ ! -d ".git" ]; then
    err "Not a git repository"
    return 1
  fi

  git add -A
  local changes=$(git status --short | wc -l)
  if [ "$changes" -eq 0 ]; then
    info "Nothing to push"
    return 0
  fi

  info "$changes file(s) changed"
  git commit -m "$msg" 2>/dev/null
  git push 2>/dev/null && ok "Pushed to GitHub" || err "Push failed"
}

# ═════════════════════════════════════════════════════════════════════════════
#  TERMUX TOOLS
# ═════════════════════════════════════════════════════════════════════════════
cmd_termux() {
  local action="${1:-info}"
  header
  echo -e "${BOLD}📱 Termux Tools${N}\n"

  case "$action" in
    info)
      echo -e "  ${W}System Info:${N}"
      echo -e "    CPU:    $(uname -m)"
      echo -e "    Kernel: $(uname -r)"
      echo -e "    User:   $(whoami)"
      echo -e "    Home:   $HOME"
      echo -e "    PWD:    $(pwd)"
      echo ""
      echo -e "  ${W}Storage:${N}"
      df -h "$HOME" 2>/dev/null | tail -1 | awk '{printf "    Used: %s / %s (%s)\n", $3, $2, $5}'
      echo ""
      echo -e "  ${W}Installed:${N}"
      for pkg in python nodejs git curl jq termux-api; do
        command -v "${pkg%%-*}" &>/dev/null && printf "    ${G}✅${N} %s\n" "$pkg" || printf "    ${R}❌${N} %s\n" "$pkg"
      done
      ;;
    install)
      info "Installing Termux dependencies..."
      pkg update -y 2>/dev/null
      pkg install -y python nodejs git curl jq termux-api wget unzip 2>/dev/null
      pip install requests cryptography 2>/dev/null
      ok "Dependencies installed"
      ;;
    notification)
      shift
      local msg="$*"
      termux-notification --title "⚡ Hermes" --content "$msg" 2>/dev/null && ok "Notification sent" || warn "termux-api not available"
      ;;
    clipboard)
      shift
      local text="$*"
      echo "$text" | termux-clipboard-set 2>/dev/null && ok "Copied to clipboard" || warn "termux-api not available"
      ;;
    *)
      echo -e "  ${W}Commands:${N} info, install, notification <msg>, clipboard <text>"
      ;;
  esac
}

# ═════════════════════════════════════════════════════════════════════════════
#  LINKS
# ═════════════════════════════════════════════════════════════════════════════
cmd_links() {
  header
  echo -e "${BOLD}🔗 All Links${N}\n"
  echo -e "  ${Y}Cloudflare Workers:${N}"
  echo -e "    Dashboard:   $GATEWAY/dashboard"
  echo -e "    Chat:        $GATEWAY/chat"
  echo -e "    Chat-Live:   $GATEWAY/chat-live"
  echo -e "    CrewAI:      $GATEWAY/crew"
  echo -e "    Crawl4AI:    $GATEWAY/crawl4ai"
  echo -e "    Zapier:      $GATEWAY/zapier"
  echo -e "    Logs:        $GATEWAY/logs"
  echo -e "    API:         $GATEWAY/api"
  echo -e "    Models:      $GATEWAY/v1/models"
  echo -e "    CF AI:       $CF_AI"
  echo -e "    Links Hub:   $LINKS_HUB"
  echo ""
  echo -e "  ${B}Cloud Run:${N}"
  echo -e "    ai-vitality: $CLOUDRUN/dashboard"
  echo -e "    Chat:        $CLOUDRUN/chat-live"
  echo -e "    API:         $CLOUDRUN/api"
  echo -e "    isdocker:    $ISDOCKER"
  echo ""
  echo -e "  ${G}Firebase:${N}"
  echo -e "    Console:     https://console.firebase.google.com/project/$FIREBASE_PROJECT"
  echo -e "    Hosting:     https://$FIREBASE_PROJECT.web.app"
  echo ""
  echo -e "  ${P}GitHub:${N}"
  echo -e "    Profile:     https://github.com/$GH_USER"
  echo -e "    Hermes:      https://github.com/$GH_USER/Solace-Hermes-Project"
  echo -e "    RoadFX:      https://github.com/$GH_USER/roadfx-full-stack"
  echo -e "    AI-Vitality: https://github.com/$GH_USER/ai-vitality"
  echo ""
  echo -e "  ${C}Auth:${N}"
  echo -e "    Clerk:       https://awake-chicken-95.clerk.accounts.dev"
}

# ═════════════════════════════════════════════════════════════════════════════
#  UPDATE CLI
# ═════════════════════════════════════════════════════════════════════════════
cmd_update() {
  header
  echo -e "${BOLD}🔄 Update Hermes CLI${N}\n"
  info "Fetching latest from GitHub..."

  local url="https://raw.githubusercontent.com/$GH_USER/hermes-agent-cli/main/hermes"
  local tmp="/tmp/hermes_new_$$"

  # Try curl with -L (follow redirects) and timeout
  curl -sL --max-time 30 -o "$tmp" "$url" 2>/dev/null

  # Fallback: try wget if curl failed
  if [ ! -s "$tmp" ]; then
    wget -q --timeout=30 -O "$tmp" "$url" 2>/dev/null
  fi

  # Fallback 2: try GitHub API
  if [ ! -s "$tmp" ]; then
    curl -sL --max-time 30 \
      -H "Accept: application/vnd.github.v3.raw" \
      "https://api.github.com/repos/$GH_USER/hermes-agent-cli/contents/hermes" \
      -o "$tmp" 2>/dev/null
  fi

  if [ -s "$tmp" ]; then
    local new_ver=$(grep '^VERSION=' "$tmp" | head -1 | cut -d'"' -f2)
    info "Current: v$VERSION → Remote: v${new_ver:-unknown}"

    if [ "$new_ver" != "$VERSION" ]; then
      local target="$(which hermes 2>/dev/null || echo "$PREFIX/bin/hermes")"
      cp "$tmp" "$target" 2>/dev/null && chmod +x "$target" && ok "Updated to v$new_ver" || {
        # Fallback: save to HERMES_DIR
        cp "$tmp" "$HERMES_DIR/hermes" && chmod +x "$HERMES_DIR/hermes"
        ok "Saved to $HERMES_DIR/hermes"
        warn "Add to PATH: export PATH=\"$HERMES_DIR:\$PATH\""
      }
    else
      info "Already up to date (v$VERSION)"
    fi
  else
    warn "Could not fetch update"
    echo ""
    echo -e "  ${Y}Manual update:${N}"
    echo -e "    ${C}curl -sL $url -o \$PREFIX/bin/hermes && chmod +x \$PREFIX/bin/hermes${N}"
  fi
  rm -f "$tmp"
}

# ═════════════════════════════════════════════════════════════════════════════
#  DOCTOR — Comprehensive Diagnostic
# ═════════════════════════════════════════════════════════════════════════════
cmd_doctor() {
  header
  echo -e "${BOLD}🩺 Hermes Doctor — Full Diagnostic${N}\n"

  local pass=0 fail=0 warn=0

  check() {
    local name="$1" status="$2" detail="${3:-}"
    case "$status" in
      ok)   printf "  ${G}✅${N} %-35s %s\n" "$name" "$detail"; pass=$((pass+1)) ;;
      fail) printf "  ${R}❌${N} %-35s %s\n" "$name" "$detail"; fail=$((fail+1)) ;;
      warn) printf "  ${Y}⚠️${N}  %-35s %s\n" "$name" "$detail"; warn=$((warn+1)) ;;
    esac
  }

  # ── 1. System ──
  echo -e "  ${Y}── System ──${N}"
  command -v python3 &>/dev/null && check "Python3" "ok" "$(python3 --version 2>&1)" || check "Python3" "fail" "not found"
  command -v node &>/dev/null && check "Node.js" "ok" "$(node --version 2>/dev/null)" || check "Node.js" "warn" "not found"
  command -v git &>/dev/null && check "Git" "ok" "$(git --version 2>/dev/null | cut -d' ' -f3)" || check "Git" "fail" "not found"
  command -v curl &>/dev/null && check "curl" "ok" "installed" || check "curl" "fail" "not found"
  command -v jq &>/dev/null && check "jq" "ok" "installed" || check "jq" "warn" "not found (optional)"
  command -v udocker &>/dev/null && check "udocker" "ok" "installed" || check "udocker" "warn" "not found (for containers)"
  echo ""

  # ── 2. API Keys ──
  echo -e "  ${Y}── API Keys ──${N}"
  [ -n "$TOKEN" ] && check "TOKEN" "ok" "${TOKEN:0:12}..." || check "TOKEN" "fail" "not set"
  [ -n "$GROQ_KEY" ] && check "GROQ_KEY" "ok" "${GROQ_KEY:0:12}..." || check "GROQ_KEY" "fail" "not set"
  [ -n "$OR_KEY" ] && check "OR_KEY" "ok" "${OR_KEY:0:12}..." || check "OR_KEY" "fail" "not set"
  [ -n "$GEMINI_KEY" ] && check "GEMINI_KEY" "ok" "${GEMINI_KEY:0:12}..." || check "GEMINI_KEY" "fail" "not set"
  [ -n "$ISDOCKER_GEMINI_KEY" ] && check "ISDOCKER_GEMINI_KEY" "ok" "${ISDOCKER_GEMINI_KEY:0:12}..." || check "ISDOCKER_GEMINI_KEY" "warn" "not set"
  [ -n "$CF_TOKEN" ] && check "CF_TOKEN" "ok" "${CF_TOKEN:0:12}..." || check "CF_TOKEN" "warn" "not set"
  [ -n "$CF_AI_TOKEN" ] && check "CF_AI_TOKEN" "ok" "${CF_AI_TOKEN:0:12}..." || check "CF_AI_TOKEN" "warn" "not set"
  [ -n "$GITHUB_PAT" ] && check "GITHUB_PAT" "ok" "${GITHUB_PAT:0:16}..." || check "GITHUB_PAT" "fail" "not set"
  [ -n "$VOYAGE_KEY" ] && check "VOYAGE_KEY" "ok" "${VOYAGE_KEY:0:12}..." || check "VOYAGE_KEY" "warn" "not set"
  [ -n "$MONGO_URI" ] && check "MONGO_URI" "ok" "configured" || check "MONGO_URI" "warn" "not set"
  [ -n "$SOLACE_URL" ] && check "SOLACE_URL" "ok" "configured" || check "SOLACE_URL" "warn" "not set"
  [ -n "$FIREBASE_API_KEY" ] && check "FIREBASE_API_KEY" "ok" "Project: $FIREBASE_PROJECT" || check "FIREBASE_API_KEY" "fail" "not set"
  echo ""

  # ── 3. Live Endpoints ──
  echo -e "  ${Y}── Live Endpoints ──${N}"
  for entry in \
    "hermes-cloudflare|$GATEWAY/health" \
    "hermes-webhook|$GATEWAY_MIRROR/health" \
    "certve-webhook|$GATEWAY_BACKUP/health" \
    "cf-ai-factory|$CF_AI/models" \
    "rocspace-links|$LINKS_HUB/" \
    "ai-vitality (Cloud Run)|$CLOUDRUN/health" \
    "isdocker (Cloud Run)|$ISDOCKER"; do
    local name="${entry%%|*}"
    local url="${entry##*|}"
    local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
      check "$name" "ok" "HTTP $code"
    elif [ "$code" = "403" ]; then
      check "$name" "ok" "HTTP $code (CF protection, alive)"
    elif [ "$code" = "000" ]; then
      check "$name" "fail" "TIMEOUT"
    else
      check "$name" "warn" "HTTP $code"
    fi
  done
  echo ""

  # ── 4. AI Provider Live Test ──
  echo -e "  ${Y}── AI Provider Test ──${N}"
  if [ -n "$GROQ_KEY" ]; then
    local r=$(curl -s --max-time 10 -X POST "https://api.groq.com/openai/v1/chat/completions" \
      -H "Authorization: Bearer $GROQ_KEY" -H "Content-Type: application/json" \
      -d '{"model":"llama-3.1-8b-instant","messages":[{"role":"user","content":"ping"}],"max_tokens":1}' 2>/dev/null)
    echo "$r" | grep -q '"choices"' && check "Groq API" "ok" "Response OK" || check "Groq API" "fail" "$(echo "$r" | head -c 80)"
  else
    check "Groq API" "warn" "No key"
  fi

  if [ -n "$OR_KEY" ]; then
    local r=$(curl -s --max-time 10 -H "Authorization: Bearer $OR_KEY" "https://openrouter.ai/api/v1/models" 2>/dev/null | head -c 100)
    echo "$r" | grep -q '"data"' && check "OpenRouter API" "ok" "Models list OK" || check "OpenRouter API" "fail" "Cannot reach"
  else
    check "OpenRouter API" "warn" "No key"
  fi

  if [ -n "$GEMINI_KEY" ]; then
    local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_KEY" 2>/dev/null)
    [ "$code" = "200" ] && check "Gemini API" "ok" "HTTP $code" || check "Gemini API" "fail" "HTTP $code"
  else
    check "Gemini API" "warn" "No key"
  fi

  if [ -n "$GITHUB_PAT" ]; then
    local user=$(curl -s --max-time 10 -H "Authorization: token $GITHUB_PAT" "https://api.github.com/user" 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('login','?'))" 2>/dev/null)
    [ "$user" != "?" ] && check "GitHub API" "ok" "User: $user" || check "GitHub API" "fail" "PAT expired"
  else
    check "GitHub API" "warn" "No PAT"
  fi
  echo ""

  # ── 5. GCP / Cloud Run ──
  echo -e "  ${Y}── GCP / Cloud Run ──${N}"
  check "GCP Project" "ok" "$GCP_PROJECT"
  check "GCP Region" "ok" "$GCP_REGION"
  local cr_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$CLOUDRUN/health" 2>/dev/null)
  [ "$cr_code" = "200" ] && check "ai-vitality service" "ok" "HTTP $cr_code" || check "ai-vitality service" "warn" "HTTP $cr_code"
  local isd_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$ISDOCKER" 2>/dev/null)
  [ "$isd_code" = "200" ] && check "isdocker service" "ok" "HTTP $isd_code" || check "isdocker service" "warn" "HTTP $isd_code"
  echo ""

  # ── 6. File System ──
  echo -e "  ${Y}── File System ──${N}"
  [ -d "$HERMES_DIR" ] && check "HERMES_DIR" "ok" "$HERMES_DIR" || check "HERMES_DIR" "warn" "not created yet"
  [ -f "$HERMES_KEYS" ] && check "Keys file" "ok" "$HERMES_KEYS" || check "Keys file" "warn" "not saved (run setup)"
  [ -d "$HERMES_WORKSPACE" ] && check "Workspace" "ok" "$HERMES_WORKSPACE" || check "Workspace" "warn" "not created"
  echo ""

  # ── Summary ──
  local total=$((pass+fail+warn))
  echo -e "  ${B}══════════════════════════════════════════════════════${N}"
  printf "  ${B}║${N}  Total: %d  |  ${G}✅ %d${N}  |  ${R}❌ %d${N}  |  ${Y}⚠️  %d${N}\n" "$total" "$pass" "$fail" "$warn"
  echo -e "  ${B}══════════════════════════════════════════════════════${N}"

  if [ "$fail" -gt 0 ]; then
    echo ""
    echo -e "  ${Y}Run ${BOLD}hermes fix${N}${Y} to auto-repair issues${N}"
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
#  ISDOCKER — Container Manager + Cloud Run Integration
# ═════════════════════════════════════════════════════════════════════════════
cmd_isdocker() {
  local action="${1:-status}"
  shift 2>/dev/null || true

  header
  echo -e "${BOLD}🐳 isdocker — Container Manager${N}"
  echo -e "  ${D}Cloud Run: $ISDOCKER${N}"
  echo -e "  ${D}GCP Project: $GCP_PROJECT | Region: $GCP_REGION${N}\n"

  case "$action" in
    status)
      echo -e "  ${Y}── Cloud Run Services ──${N}"
      for svc in "ai-vitality" "isdocker"; do
        local url="https://${svc}-${GCP_PROJECT}.${GCP_REGION}.run.app"
        local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null || echo "000")
        if [ "$code" = "200" ]; then
          printf "  ${G}✅${N} %-25s HTTP %s  %s\n" "$svc" "$code" "$url"
        else
          printf "  ${R}❌${N} %-25s HTTP %s  %s\n" "$svc" "$code" "$url"
        fi
      done
      echo ""
      echo -e "  ${Y}── Local Containers (udocker) ──${N}"
      if command -v udocker &>/dev/null; then
        local containers=$(udocker ps 2>/dev/null | tail -n +2)
        if [ -n "$containers" ]; then
          echo "$containers" | while read -r line; do echo "  $line"; done
        else
          echo -e "  ${D}No containers running${N}"
        fi
      else
        echo -e "  ${Y}⚠️  udocker not installed${N}"
        echo -e "  ${D}Install: hermes isdocker install${N}"
      fi
      echo ""
      echo -e "  ${Y}── Available OS Images ──${N}"
      echo -e "    📦 debian      — Debian Linux"
      echo -e "    📦 ubuntu      — Ubuntu Linux"
      echo -e "    📦 kali        — Kali Linux (pentesting)"
      echo -e "    📦 nethunter   — Kali NetHunter (Android)"
      echo ""
      echo -e "  ${Y}── Available Apps ──${N}"
      echo -e "    🤖 crewai      — CrewAI multi-agent"
      echo -e "    📊 jupyter     — Jupyter Notebook"
      echo -e "    💾 redis       — Redis database"
      echo -e "    🔗 tailscale   — Tailscale VPN"
      echo -e "    📚 calibre-web — Calibre e-book server"
      echo -e "    🌐 httpd       — Apache HTTP server"
      ;;

    install)
      echo -e "  ${B}Installing udocker + dependencies...${N}\n"
      if ! command -v udocker &>/dev/null; then
        info "Installing udocker..."
        pip install udocker 2>/dev/null && ok "udocker installed" || {
          # Fallback: manual install
          mkdir -p "$HOME/.udocker/bin"
          curl -sL "https://github.com/indigo-dc/udocker/releases/download/1.3.17/udocker-1.3.17.tar.gz" | tar xz -C "$HOME/.udocker" 2>/dev/null
          export PATH="$HOME/.udocker/udocker:$PATH"
          ok "udocker installed (manual)"
        }
      else
        ok "udocker already installed"
      fi

      # Clone isdocker repo
      if [ -n "$GITHUB_PAT" ] && [ ! -d "$HERMES_WORKSPACE/isdocker" ]; then
        info "Cloning isdocker repo..."
        git clone --depth 1 "https://x-access-token:${GITHUB_PAT}@github.com/${GH_USER}/isdocker.git" "$HERMES_WORKSPACE/isdocker" 2>/dev/null \
          && ok "isdocker cloned to $HERMES_WORKSPACE/isdocker" \
          || warn "Clone failed"
      fi
      echo ""
      ok "Setup complete. Run: hermes isdocker run <os|app>"
      ;;

    run)
      local target="$1"
      [ -z "$target" ] && { err "Usage: hermes isdocker run <debian|ubuntu|kali|nethunter|crewai|jupyter|redis>"; return 1; }

      if [ -d "$HERMES_WORKSPACE/isdocker" ]; then
        local script=""
        case "$target" in
          debian|ubuntu|kali|nethunter) script="$HERMES_WORKSPACE/isdocker/os/$target/${target}.sh" ;;
          crewai) script="$HERMES_WORKSPACE/isdocker/apps/crewai/crewai.sh" ;;
          jupyter) script="$HERMES_WORKSPACE/isdocker/apps/jupyter/jupyter.sh" ;;
          redis) script="$HERMES_WORKSPACE/isdocker/apps/redis/redis.sh" ;;
          tailscale) script="$HERMES_WORKSPACE/isdocker/apps/tailscale/tailscale.sh" ;;
          httpd) script="$HERMES_WORKSPACE/isdocker/apps/httpd/httpd.sh" ;;
          *) err "Unknown target: $target"; return 1 ;;
        esac

        if [ -f "$script" ]; then
          info "Running $target..."
          bash "$script"
        else
          err "Script not found: $script"
        fi
      else
        err "isdocker not cloned. Run: hermes isdocker install"
      fi
      ;;

    ps|list)
      if command -v udocker &>/dev/null; then
        udocker ps 2>/dev/null || echo -e "  ${D}No containers${N}"
      else
        warn "udocker not installed. Run: hermes isdocker install"
      fi
      ;;

    stop)
      local name="$1"
      [ -z "$name" ] && { err "Usage: hermes isdocker stop <container-name>"; return 1; }
      udocker rm "$name" 2>/dev/null && ok "Container $name removed" || err "Failed to stop $name"
      ;;

    deploy)
      local svc="${1:-isdocker}"
      echo -e "  ${B}Deploy to Cloud Run: $svc${N}\n"
      info "Project: $GCP_PROJECT | Region: $GCP_REGION"
      echo ""
      echo -e "  ${D}Requires gcloud CLI. Run:${N}"
      echo -e "    gcloud run deploy $svc \\"
      echo -e "      --source . \\"
      echo -e "      --region $GCP_REGION \\"
      echo -e "      --project $GCP_PROJECT \\"
      echo -e "      --allow-unauthenticated"
      ;;

    *)
      echo -e "  ${W}Commands:${N}"
      echo -e "    ${BOLD}status${N}              Show Cloud Run + local containers"
      echo -e "    ${BOLD}install${N}             Install udocker + clone repo"
      echo -e "    ${BOLD}run${N} <os|app>        Run container (debian/ubuntu/kali/crewai/jupyter/redis)"
      echo -e "    ${BOLD}ps${N}                  List running containers"
      echo -e "    ${BOLD}stop${N} <name>         Stop/remove container"
      echo -e "    ${BOLD}deploy${N} [service]    Deploy to Cloud Run"
      ;;
  esac
}

# ═════════════════════════════════════════════════════════════════════════════
#  AI STUDIO — Interactive AI Studio Experience
# ═════════════════════════════════════════════════════════════════════════════
cmd_studio() {
  local action="${1:-interactive}"
  shift 2>/dev/null || true

  case "$action" in
    open|browser)
      # Open AI Studio in browser
      if command -v termux-open-url &>/dev/null; then
        termux-open-url "$AI_STUDIO_URL" 2>/dev/null && ok "Opened AI Studio in browser" || warn "Failed to open"
      elif command -v xdg-open &>/dev/null; then
        xdg-open "$AI_STUDIO_URL" 2>/dev/null && ok "Opened AI Studio" || warn "Failed to open"
      else
        echo -e "  ${Y}📎${N} Open this URL manually:"
        echo -e "    ${C}$AI_STUDIO_URL${N}"
      fi
      ;;

    status)
      header
      echo -e "${BOLD}🎨 AI Studio — Project Status${N}\n"
      echo -e "  ${Y}── Projects ──${N}"
      
      # Check ai-vitality
      local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$CLOUDRUN/health" 2>/dev/null || echo "000")
      if [ "$code" = "200" ]; then
        printf "  ${G}✅${N} %-20s %s\n" "ai-vitality" "$CLOUDRUN"
      else
        printf "  ${R}❌${N} %-20s HTTP %s\n" "ai-vitality" "$code"
      fi

      # Check isdocker
      code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$ISDOCKER" 2>/dev/null || echo "000")
      if [ "$code" = "200" ]; then
        printf "  ${G}✅${N} %-20s %s\n" "isdocker" "$ISDOCKER"
      else
        printf "  ${R}❌${N} %-20s HTTP %s\n" "isdocker" "$code"
      fi

      echo ""
      echo -e "  ${Y}── Google AI Studio ──${N}"
      echo -e "    ${C}$AI_STUDIO_URL${N}"
      echo ""
      echo -e "  ${Y}── Quick Actions ──${N}"
      echo -e "    ${BOLD}hermes studio${N}           Interactive AI Studio"
      echo -e "    ${BOLD}hermes studio open${N}      Open in browser"
      echo -e "    ${BOLD}hermes studio chat${N}      Chat with Gemini"
      ;;

    chat)
      # Direct Gemini chat (like AI Studio)
      header
      echo -e "${BOLD}🎨 AI Studio Chat${N} — Gemini"
      echo -e "  ${D}Type 'exit' to quit, '/model <name>' to switch${N}\n"

      local model="gemini-2.0-flash-exp"
      local messages="[]"

      while true; do
        printf "${P}You>${N} "
        read -r input
        [ -z "$input" ] && continue
        [ "$input" = "exit" ] || [ "$input" = "quit" ] && break

        if [[ "$input" == /model* ]]; then
          model="${input#/model }"
          echo -e "  ${C}Model → $model${N}"
          continue
        fi

        # Build Gemini request
        messages=$(python3 -c "
import json,sys
msgs = json.loads(sys.argv[1])
msgs.append({'role':'user','parts':[{'text':sys.argv[2]}]})
print(json.dumps(msgs))
" "$messages" "$input" 2>/dev/null || echo "$messages")

        printf "${P}Gemini>${N} "
        local resp=$(curl -s --max-time 30 -X POST \
          "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$GEMINI_KEY" \
          -H "Content-Type: application/json" \
          -d "{\"contents\":$messages,\"generationConfig\":{\"temperature\":0.7,\"maxOutputTokens\":8192}}" 2>/dev/null)

        local content=$(echo "$resp" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    print(d['candidates'][0]['content']['parts'][0]['text'])
except Exception as e:
    print('Error: ' + str(e))
" 2>/dev/null || echo "$resp" | head -c 500)

        echo "$content"
        echo ""

        # Add to history
        messages=$(python3 -c "
import json,sys
msgs = json.loads(sys.argv[1])
msgs.append({'role':'model','parts':[{'text':sys.argv[2]}]})
print(json.dumps(msgs))
" "$messages" "$content" 2>/dev/null || echo "$messages")
      done
      ;;

    *)
      # Interactive AI Studio mode
      header
      echo -e "${BOLD}🎨 AI Studio${N} — Interactive Mode"
      echo -e "  ${D}Your AI projects at your fingertips${N}\n"
      
      echo -e "  ${Y}── Your Projects ──${N}"
      echo -e "    ${G}1.${N} ${BOLD}ai-vitality${N}    — Multi-agent AI platform"
      echo -e "       ${D}$CLOUDRUN${N}"
      echo -e "    ${G}2.${N} ${BOLD}isdocker${N}       — Container manager"
      echo -e "       ${D}$ISDOCKER${N}"
      echo -e "    ${G}3.${N} ${BOLD}AI Studio${N}      — Google AI Studio"
      echo -e "       ${D}$AI_STUDIO_URL${N}"
      echo ""
      
      echo -e "  ${Y}── Quick Actions ──${N}"
      echo -e "    ${C}/chat${N}            Chat with Gemini (like AI Studio)"
      echo -e "    ${C}/open${N}            Open AI Studio in browser"
      echo -e "    ${C}/vitality${N}        Open ai-vitality dashboard"
      echo -e "    ${C}/docker${N}          Open isdocker"
      echo -e "    ${C}/ask <question>${N}  Quick AI question"
      echo -e "    ${C}/code <desc>${N}     Generate code"
      echo -e "    ${C}/status${N}          Show project status"
      echo -e "    ${C}/exit${N}            Exit studio"
      echo ""

      while true; do
        printf "${P}studio>${N} "
        read -r input
        [ -z "$input" ] && continue
        [ "$input" = "/exit" ] || [ "$input" = "/quit" ] && break

        case "$input" in
          /chat)
            cmd_studio chat
            ;;
          /open)
            cmd_studio open
            ;;
          /vitality)
            if command -v termux-open-url &>/dev/null; then
              termux-open-url "$CLOUDRUN/dashboard" 2>/dev/null && ok "Opened ai-vitality"
            else
              echo -e "  ${C}$CLOUDRUN/dashboard${N}"
            fi
            ;;
          /docker)
            if command -v termux-open-url &>/dev/null; then
              termux-open-url "$ISDOCKER" 2>/dev/null && ok "Opened isdocker"
            else
              echo -e "  ${C}$ISDOCKER${N}"
            fi
            ;;
          /ask*)
            local question="${input#/ask }"
            if [ -n "$question" ]; then
              echo ""
              PROVIDER=gemini MODEL=gemini-2.0-flash-exp cmd_ask "$question"
              echo ""
            else
              warn "Usage: /ask <question>"
            fi
            ;;
          /code*)
            local desc="${input#/code }"
            if [ -n "$desc" ]; then
              echo ""
              cmd_code "$desc"
              echo ""
            else
              warn "Usage: /code <description>"
            fi
            ;;
          /status)
            cmd_studio status
            ;;
          1)
            cmd_studio open
            ;;
          2)
            if command -v termux-open-url &>/dev/null; then
              termux-open-url "$ISDOCKER" 2>/dev/null && ok "Opened isdocker"
            else
              echo -e "  ${C}$ISDOCKER${N}"
            fi
            ;;
          3)
            if command -v termux-open-url &>/dev/null; then
              termux-open-url "$AI_STUDIO_URL" 2>/dev/null && ok "Opened AI Studio"
            else
              echo -e "  ${C}$AI_STUDIO_URL${N}"
            fi
            ;;
          *)
            # Treat as a question to AI
            echo ""
            PROVIDER=gemini MODEL=gemini-2.0-flash-exp cmd_ask "$input"
            echo ""
            ;;
        esac
      done
      ;;
  esac
}

# ═════════════════════════════════════════════════════════════════════════════
#  FIX — Auto-repair syntax errors and common issues
# ═════════════════════════════════════════════════════════════════════════════
# ─── Data Storage (Cloud Run) ────────────────────────────────────────────────
cmd_data() {
  local action="${1:-status}"
  local cloudrun_url="https://ai-vitality-819208434965.us-west1.run.app"
  
  case "$action" in
    status)
      header
      echo -e "${BOLD}💾 Data Storage — Cloud Run${N}\n"
      echo -e "  ${W}Endpoint:${N} $cloudrun_url"
      echo ""
      
      # Test connectivity
      echo -n "  Testing connection... "
      local resp=$(curl -s -w "\n%{http_code}" --max-time 10 "$cloudrun_url/health" 2>/dev/null)
      local code=$(echo "$resp" | tail -1)
      local body=$(echo "$resp" | head -n -1)
      
      if [ "$code" = "200" ]; then
        echo -e "${G}✅ Connected${N}"
      else
        echo -e "${R}❌ Failed (HTTP $code)${N}"
        echo -e "  ${D}Response: ${body:0:100}${N}"
        return 1
      fi
      
      echo ""
      echo -e "  ${Y}Available endpoints:${N}"
      echo -e "    ${C}/api/file-list${N}     List workspace files"
      echo -e "    ${C}/chat${N}              AI chat interface"
      echo -e "    ${C}/v1/chat/completions${N}  OpenAI-compatible API"
      echo -e "    ${C}/solace/status${N}     Solace broker status"
      ;;
    
    list)
      header
      echo -e "${BOLD}📂 Workspace Files${N}\n"
      curl -s "$cloudrun_url/api/file-list" | python3 -c "
import json,sys
d=json.load(sys.stdin)
files=d.get('files',[])
print(f'  Found {len(files)} files:\n')
for f in files[:20]:
    print(f'    📄 {f}')
if len(files) > 20:
    print(f'    ... and {len(files)-20} more')
" 2>/dev/null || echo -e "  ${R}Failed to fetch file list${N}"
      ;;
    
    save)
      shift
      local message="$*"
      if [ -z "$message" ]; then
        header
        echo -e "${R}Usage: hermes data save <message>${N}"
        return 1
      fi
      
      header
      echo -e "${BOLD}💾 Save Data${N}\n"
      
      # Save to in-memory LOGS store via worker endpoint
      local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
      local payload=$(python3 -c "import json; print(json.dumps({'message': '''$message''', 'timestamp': '$timestamp', 'source': 'hermes-cli'}))")
      
      echo -n "  Saving to Cloud Run... "
      local resp=$(curl -s -X POST "$cloudrun_url/api/log" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null)
      
      if echo "$resp" | grep -q "success\|saved\|ok"; then
        echo -e "${G}✅ Saved${N}"
      else
        echo -e "${Y}⚠️  Saved to local storage (Cloud Run endpoint not available)${N}"
        # Fallback to local storage
        echo "$payload" >> "$HERMES_DIR/data_log.json"
      fi
      ;;
    
    *)
      header
      echo -e "${BOLD}💾 Data Storage Commands${N}\n"
      echo -e "  ${C}hermes data status${N}    Check Cloud Run connection"
      echo -e "  ${C}hermes data list${N}      List workspace files"
      echo -e "  ${C}hermes data save <msg>${N}  Save message to storage"
      echo ""
      echo -e "  ${D}Storage: Cloud Run in-memory (resets on deploy)${N}"
      ;;
  esac
}


cmd_fix() {
  local target="${1:-all}"
  header
  echo -e "${BOLD}🔧 Hermes Fix — Auto-Repair${N}\n"

  case "$target" in
    all)
      info "Running all fixes..."
      echo ""

      # Fix 1: Keys file permissions
      if [ -f "$HERMES_KEYS" ]; then
        local perms=$(stat -c %a "$HERMES_KEYS" 2>/dev/null || stat -f %Lp "$HERMES_KEYS" 2>/dev/null)
        if [ "$perms" != "600" ]; then
          chmod 600 "$HERMES_KEYS" 2>/dev/null
          ok "Fixed keys file permissions → 600"
        else
          ok "Keys file permissions OK (600)"
        fi
      fi

      # Fix 2: Create missing dirs
      for d in "$HERMES_DIR" "$HERMES_WORKSPACE"; do
        if [ ! -d "$d" ]; then
          mkdir -p "$d"
          ok "Created $d"
        fi
      done

      # Fix 3: Validate JSON in keys file
      if [ -f "$HERMES_KEYS" ]; then
        local bad_lines=$(grep -cE '^[^#=]+=.*[^\\]"[^"]*$' "$HERMES_KEYS" 2>/dev/null || echo 0)
        if [ "$bad_lines" -gt 0 ]; then
          warn "Found $bad_lines potential syntax errors in keys file"
          # Auto-fix: remove lines with unmatched quotes
          python3 -c "
import re
with open('$HERMES_KEYS') as f:
    lines = f.readlines()
fixed = []
for line in lines:
    line = line.strip()
    if not line or line.startswith('#'):
        fixed.append(line)
        continue
    if '=' in line:
        key, val = line.split('=', 1)
        # Remove surrounding quotes if mismatched
        val = val.strip()
        if val.count('\"') % 2 != 0:
            val = val.replace('\"', '')
        if val.count(\"'\") % 2 != 0:
            val = val.replace(\"'\", '')
        fixed.append(f'{key}={val}')
    else:
        fixed.append(line)
with open('$HERMES_KEYS', 'w') as f:
    f.write('\n'.join(fixed) + '\n')
" 2>/dev/null && ok "Fixed syntax errors in keys file" || warn "Could not auto-fix keys file"
        else
          ok "Keys file syntax OK"
        fi
      fi

      # Fix 4: Test and repair connections
      echo ""
      info "Testing connections..."
      local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$GATEWAY/health" 2>/dev/null)
      [ "$code" = "200" ] && ok "Gateway: reachable" || warn "Gateway: HTTP $code"

      if [ -n "$GROQ_KEY" ]; then
        code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 \
          -H "Authorization: Bearer $GROQ_KEY" \
          "https://api.groq.com/openai/v1/models" 2>/dev/null)
        [ "$code" = "200" ] && ok "Groq: valid key" || warn "Groq: HTTP $code (key may be expired)"
      fi

      if [ -n "$GEMINI_KEY" ]; then
        code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 \
          "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_KEY" 2>/dev/null)
        [ "$code" = "200" ] && ok "Gemini: valid key" || warn "Gemini: HTTP $code (key may be expired)"
      fi

      # Fix 5: Update PATH
      if [ -d "$HOME/.udocker" ] && [[ ":$PATH:" != *":$HOME/.udocker:"* ]]; then
        echo "export PATH=\"\$HOME/.udocker:\$PATH\"" >> "$HERMES_CONFIG" 2>/dev/null
        ok "Added udocker to PATH in config"
      fi

      echo ""
      ok "Fix complete"
      ;;

    syntax)
      info "Checking syntax of all scripts..."
      local errors=0
      for f in "$HERMES_DIR"/*.sh "$HERMES_WORKSPACE"/*/tools/*.sh; do
        [ -f "$f" ] || continue
        if ! bash -n "$f" 2>/dev/null; then
          warn "Syntax error in: $f"
          errors=$((errors+1))
          # Try auto-fix with python
          python3 -c "
import re,sys
with open(sys.argv[1]) as f: content = f.read()
# Fix common issues
content = content.replace('\r\n', '\n')
content = re.sub(r'\"\"\"', '\"', content)
content = re.sub(r\"'''\", \"'\", content)
with open(sys.argv[1], 'w') as f: f.write(content)
" "$f" 2>/dev/null && ok "Auto-fixed: $(basename $f)"
        fi
      done
      [ "$errors" -eq 0 ] && ok "No syntax errors found"
      ;;

    keys)
      info "Repairing keys file..."
      if [ -f "$HERMES_KEYS" ]; then
        chmod 600 "$HERMES_KEYS"
        # Re-source to validate
        source "$HERMES_KEYS" 2>/dev/null
        ok "Keys reloaded"
      else
        warn "No keys file found. Run: hermes setup"
      fi
      ;;

    *)
      echo -e "  ${W}Commands:${N}"
      echo -e "    ${BOLD}all${N}      Run all fixes (default)"
      echo -e "    ${BOLD}syntax${N}   Fix syntax errors in scripts"
      echo -e "    ${BOLD}keys${N}     Repair keys file"
      ;;
  esac
}

# ═════════════════════════════════════════════════════════════════════════════
#  HELP
# ═════════════════════════════════════════════════════════════════════════════
cmd_help() {
  header
  echo -e "${BOLD}📖 Commands${N}\n"
  echo -e "  ${Y}AI & Chat:${N}"
  echo -e "    ${BOLD}chat${N} [model] [provider]    Interactive AI chat"
  echo -e "    ${BOLD}coding${N}                     Interactive coding assistant (/run /debug /refactor)"
  echo -e "    ${BOLD}studio${N} [open|chat|status]  AI Studio (projects + Gemini chat)"
  echo -e "    ${BOLD}ask${N} <question>             Quick question (non-interactive)"
  echo -e "    ${BOLD}code${N} <description>         Generate code from description"
  echo -e "    ${BOLD}crew${N} [topic]               Run CrewAI multi-agent research"
  echo -e "    ${BOLD}embed${N} <text>               Generate Voyage AI embedding"
  echo ""
  echo -e "  ${B}Web & Data:${N}"
  echo -e "    ${BOLD}crawl${N} <url>                Crawl URL to markdown"
  echo -e "    ${BOLD}firebase${N} [status|save]     Firebase Firestore operations"
  echo ""
  echo -e "  ${G}Models & Status:${N}"
  echo -e "    ${BOLD}models${N}                     List all available AI models"
  echo -e "    ${BOLD}status${N}                     Full system health check"
  echo -e "    ${BOLD}config${N}                     Show configuration"
  echo ""
  echo -e "  ${P}Deploy & Repos:${N}"
  echo -e "    ${BOLD}deploy${N} [worker|all]        Deploy to CF Workers (existing)"
  echo -e "    ${BOLD}clone${N} [repo|all]           Clone repositories"
  echo -e "    ${BOLD}push${N} [dir] [message]       Push to GitHub"
  echo ""
  echo -e "  ${C}System:${N}"
  echo -e "    ${BOLD}setup${N}                      Interactive API key setup"
  echo -e "    ${BOLD}doctor${N}                     Full diagnostic (keys, endpoints, AI test)
    ${BOLD}data${N} [status|list|save]    Cloud Run data storage"
  echo -e "    ${BOLD}fix${N} [all|syntax|keys]      Auto-repair syntax errors & issues"
  echo -e "    ${BOLD}isdocker${N} [status|install|run] Container manager + Cloud Run"
  echo -e "    ${BOLD}termux${N} [info|install]      Termux system tools"
  echo -e "    ${BOLD}links${N}                      Show all URLs"
  echo -e "    ${BOLD}update${N}                     Update CLI from GitHub"
  echo ""
  echo -e "  ${D}Providers: groq, openrouter, gemini, gateway, cloudrun, cfai${N}"
  echo -e "  ${D}Set: export PROVIDER=groq MODEL=llama-3.3-70b-versatile${N}"
}

# ═════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═════════════════════════════════════════════════════════════════════════════
case "${1:-help}" in
  setup)       shift; cmd_setup "$@" ;;
  config)      shift; cmd_config "$@" ;;
  chat)        shift; cmd_chat "$@" ;;
  ask)         shift; cmd_ask "$@" ;;
  coding)      shift; cmd_coding "$@" ;;
  studio)      shift; cmd_studio "$@" ;;
  code)        shift; cmd_code "$@" ;;
  crawl)       shift; cmd_crawl "$@" ;;
  crew)        shift; cmd_crew "$@" ;;
  embed)       shift; cmd_embed "$@" ;;
  firebase|fb) shift; cmd_firebase "$@" ;;
  models)      shift; cmd_models "$@" ;;
  status)      shift; cmd_status "$@" ;;
  deploy)      shift; cmd_deploy "$@" ;;
  clone)       shift; cmd_clone "$@" ;;
  push)        shift; cmd_push "$@" ;;
  termux)      shift; cmd_termux "$@" ;;
  links)       shift; cmd_links "$@" ;;
  update)      shift; cmd_update "$@" ;;
  doctor)      shift; cmd_doctor "$@" ;;
  data)        shift; cmd_data "$@" ;;
  isdocker)    shift; cmd_isdocker "$@" ;;
  fix)         shift; cmd_fix "$@" ;;
  help|--help|-h) cmd_help ;;
  version|--version|-v) echo "Hermes v$VERSION ($CODENAME)" ;;
  *)           err "Unknown command: $1"; cmd_help ;;
esac
