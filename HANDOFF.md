# 🔄 RocSpace Agent Handoff Document
> **Terakhir diupdate:** 2026-07-16 · **Versi:** v17.3.1 (site) / v17.1.1 (gateway)
> **Tujuan:** Dokumen ini untuk sesi agent baru agar bisa melanjutkan tanpa kehilangan konteks

---

## 🏗️ Arsitektur Overview

```
Internet → Cloudflare (roadfx.biz.id zone)
  ├── roc-site Worker (v17.3.1) — Unified Router, 16 domains
  │     ├── /ai/* /v1/* → proxy ke hermes-cloudflare (auto-auth)
  │     ├── /vm /vm/ → Firebase bridge page (inline HTML)
  │     ├── /vm/* → redirect ke Oracle VM IP
  │     ├── /monitor → redirect ke Oracle VM IP
  │     └── lainnya → CloudRun atau Gateway
  └── hermes-cloudflare Worker (v17.1.1) — AI Gateway
        ├── /v1/chat/completions (16 AI models, 5 providers)
        ├── /auth/clerk-config, /auth/firebase-config
        ├── /solace/status, /solace/queues
        ├── /crawl4ai, /notify, /logs
        ├── /dashboard, /chat-live, /crew, /zapier, /crawl4ai, /logs (HTML pages)
        └── Semua secret via env.XXX (secret_text bindings)

Oracle VM (161.118.253.28) → Docker containers:
  ├── Nginx (port 80) — reverse proxy
  ├── WebVirtCloud (port 8090) — KVM VM management
  ├── Uptime Kuma (port 3001) — monitoring
  ├── PostgreSQL 17 (port 5432)
  ├── Redis 7.4 (port 6379)
  └── Nginx Proxy Manager (port 8080)

CloudRun (ai-vitality) — DOWN (billing issue OR_BACR2_44)
Firebase (yttriferous-magpie-16ppv) — Auth via signInWithRedirect
Clerk (awake-chicken-95) — Auth, 26 origins, 8 social logins
Solace PubSub+ — Event mesh, Singapore, 5 queues
```

---

## 📂 Struktur Repo (ivansslo/rocspace)

```
rocspace/
├── packages/shared/src/index.ts     — AI_MODELS (16), DOMAIN_MAP (16), ENDPOINTS, CLERK_PK, utilities
├── workers/site/src/index.ts        — Unified Router (v17.3.1)
├── workers/gateway/src/
│   ├── types.ts                     — COMPONENTS, VERSION='17.1.1', Env interface
│   ├── utils.ts                     — isAuthed, json, cors, secHTML, reqMeta
│   ├── ai.ts                        — aiCall dispatcher, smart routing, fallback chain
│   ├── solace.ts                    — solaceEmit, solaceStatus, solaceQueues, solaceService
│   ├── clerk.ts                     — clerkConfig, clerkVerify, clerkUser
│   ├── crawl.ts                     — crawl4ai, simpleCrawl
│   ├── logs.ts                      — logEvent, listLogs (KV + D1)
│   ├── index.ts                     — Entry point, routing, firebaseConfig, page renderers
│   └── pages/
│       ├── chat.html (78KB, 23 Firebase refs)
│       ├── dashboard.html (15KB)
│       ├── logs.html (13KB)
│       ├── crew.html (9KB)
│       ├── crawl.html (3KB)
│       └── zapier.html (3KB)
├── scripts/
│   ├── deploy-worker.mjs            — Build + ESM deploy script
│   ├── build-gateway.mjs            — ESM build for gateway
│   └── build-site.mjs               — ESM build for site
├── webvirtcloud-firebase-bridge.html
├── webvirtcloud-firebase-config.json
├── STATUS.md                        — Infrastructure status
├── AUDIT-REPORT.md                  — Security audit report
├── HANDOFF.md                       — ← FILE INI (sanitized, no secrets)
└── README.md
```

**CATATAN:** Gateway/src sekarang sudah direkonversi ke proper TypeScript (dengan import/export). Untuk development pakai esbuild + loader .html.

---

## 🔑 Credentials Reference

**⚠️ SEMUA credentials ada di file lokal `/home/user/.config/hermes/solace.env` dan `/home/user/.config/oci/`**
**JANGAN commit credentials ke git. Gunakan env/secrets binding.**

### Identifiers (bukan secret, public)
- **CF Account ID:** `37c44b4d3f192a627d20e46bdf910e79`
- **CF Zone ID:** `8df888939e609421ac15e6fdade11ad4` (roadfx.biz.id)
- **Clerk PK:** `pk_test_YXdha2UtY2hpY2tlbi05NS5jbGVyay5hY2NvdW50cy5kZXYk` (public browser key)
- **Firebase API Key:** `AIzaSyBLpdsheG9pYmtYqGgo0af0_5Du_fDvJYk` (public browser key)
- **Firebase Project:** yttriferous-magpie-16ppv (819208434965)
- **Oracle VM IP:** 161.118.253.28
- **Tailscale IP:** 100.93.139.73
- **Clerk Instance:** ins_3G8gr37pXbTsO89SKZWiM8BaH8L

### Secrets (env only — lihat file lokal untuk nilai)
| Nama Binding | Fungsi |
|---|---|
| TOKEN | Gateway auth token |
| GROQ_KEY | Groq API key |
| OR_KEY | OpenRouter API key |
| GEMINI_KEY | Google Gemini API key |
| OPENAI_KEY | OpenAI Direct API key (quota exceeded) |
| CLERK_PK | Clerk publishable key |
| CLERK_SK | Clerk secret key |
| SOLACE_URL | Solace REST endpoint |
| SOLACE_USER / SOLACE_PASS | Solace auth |
| SOLACE_API_TOKEN | Solace API token |
| SOLACE_SEMP_URL | Solace SEMP endpoint |
| SOLACE_VIEW_USER / SOLACE_VIEW_PASS | Solace monitor auth |
| FIREBASE_CONFIG | Firebase config JSON (yttriferous-magpie-16ppv) |
| GATEWAY_TOKEN | roc-site→Gateway auto-auth |

### API Tokens (lihat file lokal)
- **cfat_** → Cloudflare Workers edit (no Zone/DNS)
- **cfut_** → Cloudflare Workers AI
- **ghp_** → GitHub PAT (classic)
- **SSH key** → `~/.config/oci/ssh_key` (Oracle VM)

---

## 🤖 AI Models (16 Available)

| Provider | Model ID | Status |
|----------|----------|--------|
| Groq | llama-3.3-70b-versatile | ✅ Default |
| Groq | llama-3.1-8b-instant | ✅ |
| OpenRouter | qwen/qwen3-32b | ✅ |
| OpenRouter | qwen/qwen3-235b-a22b | ✅ |
| OpenRouter | qwen/qwen3.6-27b | ✅ |
| OpenRouter | openai/gpt-4o | ✅ |
| OpenRouter | openai/gpt-oss-120b | ✅ |
| OpenRouter | deepseek/deepseek-r1 | ✅ |
| OpenRouter | meta-llama/llama-4-scout-17b-16e-instruct | ✅ |
| OpenAI Direct | gpt-4.1 | ⚠️ Quota exceeded |
| OpenAI Direct | gpt-4.1-mini | ⚠️ Quota exceeded |
| OpenAI Direct | gpt-4o | ⚠️ Quota exceeded |
| OpenAI Direct | o3-mini | ⚠️ Quota exceeded |
| OpenAI Direct | o4-mini | ⚠️ Quota exceeded |
| Google | google/gemini-2.5-flash | ✅ |
| Google | google/gemini-2.5-pro-preview | ✅ |

**Smart Routing:** unprefixed → OpenAI Direct (jika key ada), `openai/` prefix → OpenRouter, `openai-direct/` forces Direct
**Fallback:** OpenAI → Groq → OpenRouter → Gemini

---

## 🌐 16 Domain Mappings (Semua → roc-site)

| Domain | Target |
|--------|--------|
| roadfx.biz.id | Dashboard |
| www.roadfx.biz.id | Dashboard |
| dashboard.roadfx.biz.id | CloudRun |
| chat.roadfx.biz.id | CloudRun |
| status.roadfx.biz.id | Status page |
| cloudrun.roadfx.biz.id | CloudRun |
| ai.roadfx.biz.id | Gateway |
| gateway.roadfx.biz.id | Gateway |
| api.roadfx.biz.id | Gateway |
| auth.roadfx.biz.id | Gateway |
| factory.roadfx.biz.id | Gateway |
| webhook.roadfx.biz.id | Gateway |
| r2.roadfx.biz.id | Gateway |
| app.roadfx.biz.id | Gateway/Links |
| vm.roadfx.biz.id | Firebase bridge + VM |
| monitor.roadfx.biz.id | Uptime Kuma redirect |

---

## 🚀 Cara Build & Deploy Worker

### Build (ESM bundle)
```bash
# Gateway (dengan HTML loader)
node scripts/build-gateway.mjs

# Site
node scripts/build-site.mjs
```

Atau manual:
```bash
npx esbuild workers/gateway/src/index.ts --bundle --format=esm --target=es2022 \
  --outfile=workers/gateway/dist/index.mjs \
  --alias:@rocspace/shared=./packages/shared/src/index.ts \
  --loader:.html=text

npx esbuild workers/site/src/index.ts --bundle --format=esm --target=es2022 \
  --outfile=workers/site/dist/index.mjs \
  --alias:@rocspace/shared=./packages/shared/src/index.ts
```

### Deploy (Multipart ESM via script)
```bash
# Set token
export CF_API_TOKEN=cfat_xxx

# Deploy site
node scripts/deploy-worker.mjs site --esm

# Deploy gateway
node scripts/deploy-worker.mjs gateway --esm
```

### ⚠️ CRITICAL Deploy Rules
1. **JANGAN re-declare existing bindings** — gunakan `"bindings":[]` untuk preserve
2. **Strip boundary markers** jika extract dari CF API response
3. **IIFE format TIDAK work** untuk ESM `export default` — harus multipart
4. **Set secret via metadata** hanya jika menambah binding BARU

---

## 🔧 Cara Push Git

```bash
# Set token di remote URL
git remote set-url origin https://x-access-token:TOKEN@github.com/ivansslo/rocspace.git

# Push
GIT_TERMINAL_PROMPT=0 git push origin main

# CLEAN token dari remote URL setelah push!
git remote set-url origin https://github.com/ivansslo/rocspace.git
```

### Repo Lainnya
- **roc-agentsroute:** clone fresh → copy hermes binary → push (v5.9.0)
- **roc-containers:** standard push (v1.2.0)

---

## 🐛 Known Issues & Next Steps

### ❌ Belum Terselesaikan
1. **CloudRun DOWN** — billing OR_BACR2_44, harus fix manual di GCP Console
2. **OpenAI quota exceeded** — top up di platform.openai.com
3. **Oracle VM berbayar** (~$39/month) — A1.Flex (free) "Out of host capacity"
4. **CLERK_SECRET_KEY di CloudRun** — masih pk_test_ (harus sk_test_), fix di GCP Console
5. **Port 443 CLOSED** di Oracle VM — perlu Security List + NPM SSL
6. **DNS records** — vm/monitor perlu AAAA 100:: di CF DNS (cfat lacks Zone permission)

### 📋 Next Steps
1. Fix GCP billing (OR_BACR2_44)
2. Top up OpenAI billing
3. Auto-retry script untuk A1.Flex (Always Free) VM
4. Configure NPM di Oracle VM untuk SSL/HTTPS
5. Get CF Zone/DNS token untuk proper DNS records
6. Migrate CloudRun ke rocspace monorepo code (Phase 3+)
7. Tambah lebih banyak page di gateway + test lokal

---

## 🔒 Privasi & Security Rules

1. **JANGAN hardcoded** API keys, tokens, passwords di source code
2. **Gunakan env.XXX** (Cloudflare secret_text bindings) untuk semua secret
3. **Clean git remote URL** setelah push — hapus token dari URL
4. **Clerk PK** & **Firebase API Key** = public browser keys (OK di client-side code)
5. **Clerk SK**, **OR_KEY**, **GROQ_KEY**, **OPENAI_KEY**, dll = SECRET (env only)
6. Invalid bash variable names (e.g. Unicode `₣`) harus di-skip dengan regex `^[a-zA-Z_][a-zA-Z0-9_]*$`
7. Extract Worker JS dari multipart API response: strip boundary markers atau SyntaxError

---

## 🧪 Quick Health Check

```bash
# Gateway health
curl -s https://gateway.roadfx.biz.id/api | jq .

# Firebase config
curl -s https://gateway.roadfx.biz.id/auth/firebase-config | jq .

# Clerk config
curl -s https://gateway.roadfx.biz.id/auth/clerk-config | jq .

# AI models
curl -s https://gateway.roadfx.biz.id/v1/models | jq .

# Oracle VM health
curl -s http://161.118.253.28/health | jq .

# Solace status
curl -s https://gateway.roadfx.biz.id/solace/status | jq .

# Site dashboard
curl -s -o /dev/null -w "%{http_code}" https://roadfx.biz.id/
```

---

*Dokumen ini dibuat untuk handoff antar sesi agent. Update setiap ada perubahan infrastruktur.*

## 🚀 Updated Vision (2026-07-16)

**RocSpace sebagai Infrastructure Xloud**  
- All App build + Integrated auto across every provider  
- Multi Orchestra + Autonomous Big Scale Models  
- Full model support + orchestrator modes (coding, fast, high-thinking, grounding)  
- AIS_DEV (gemini-2.5-flash) + Gateway first-class  
- Auto import roc-agentsroute agent ke AI Studio / AIS-DEV  
- roc-ai orchestrator + hermes orchestrator ready  

All commands continue to use the same TOKEN auth flow.


---

## 🚨 v18.0 Bug Fixes Applied (2026-07-16)

### Bug 1: Circular Loop (CRITICAL)
- **v18.0 changed** `ENDPOINTS.GATEWAY` from `certveis.workers.dev` to `gateway.roadfx.biz.id`
- **Result:** roc-site → gateway.roadfx.biz.id → CF routes to roc-site → infinity → **522 timeout**
- **Fix:** Reverted to `https://hermes-cloudflare.certveis.workers.dev` (internal endpoint)
- **Lesson:** roc-site CANNOT proxy to `gateway.roadfx.biz.id` because that domain maps to roc-site itself!

### Bug 2: Firebase Project Regression
- **v18.0 changed** Firebase from `yttriferous-magpie-16ppv` back to `rofai-agent`
- **Fix:** All Firebase references in site/src/index.ts restored to `yttriferous-magpie-16ppv`

### Bug 3: Wrangler Deploy Wipes Secrets
- **Issue:** `npx wrangler deploy` clears all secret_text bindings that aren't in wrangler.toml
- **Fix:** Re-set secrets via `wrangler secret put` after each deploy
- **GATEWAY_TOKEN** on roc-site and **TOKEN** on hermes-cloudflare both re-set to `rocspace2026`

### Deploy Method (Updated)
```bash
# Deploy roc-site
cd workers/site
CLOUDFLARE_API_TOKEN=cfat_TOKEN CLOUDFLARE_ACCOUNT_ID=37c44b4d3f192a627d20e46bdf910e79 npx wrangler deploy

# Re-set secrets after deploy (wrangler wipes them!)
echo "rocspace2026" | CLOUDFLARE_API_TOKEN=cfat_TOKEN CLOUDFLARE_ACCOUNT_ID=37c44b4d3f192a627d20e46bdf910e79 npx wrangler secret put GATEWAY_TOKEN --name roc-site
```
