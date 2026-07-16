# 🚀 RocSpace — AI Infrastructure Platform

> **v17.1.1** · Unified Router · 14 Domains · 16 AI Models · Cloudflare Workers + Cloud Run + Oracle VM

RocSpace is a modular AI infrastructure platform built on Cloudflare Workers, GCP Cloud Run, and Oracle Cloud VM. All 14 domains route through a single **roc-site** unified router that dispatches traffic to the appropriate backend.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
                    │   14 × *.roadfx.biz.id  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       roc-site          │  ← Unified Router (CF Worker)
                    │   18.7KB ESM bundle     │
                    └──┬──────┬──────┬───────┘
                       │      │      │
            ┌──────────┘      │      └──────────┐
            ▼                 ▼                  ▼
   ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
   │ hermes-cloud   │ │ Cloud Run    │ │ Local Pages  │
   │ flare (Gateway)│ │ ai-vitality  │ │ Status/Chat  │
   │ 144KB ESM      │ │ v15.4        │ │ (inline HTML)│
   └───────┬────────┘ └──────────────┘ └──────────────┘
           │
     ┌─────┼──────┬──────────┐
     ▼     ▼      ▼          ▼
   Groq  OpenR.  Gemini    Solace
   (AI)  (AI)    (AI)     (Events)
```

---

## 🌐 Domain Map

All 14 domains on `roadfx.biz.id` → **roc-site**:

| Domain | Routes To | Description |
|---|---|---|
| `roadfx.biz.id` | Dashboard | 🏠 Main dashboard |
| `www.roadfx.biz.id` | Dashboard | 🏠 Dashboard (www) |
| `dashboard.roadfx.biz.id` | CloudRun | 📊 Full dashboard app |
| `chat.roadfx.biz.id` | CloudRun | 💬 Chat-Live (Clerk auth) |
| `status.roadfx.biz.id` | Local page | 📈 Status monitor |
| `cloudrun.roadfx.biz.id` | CloudRun | ☁️ CloudRun proxy |
| `ai.roadfx.biz.id` | Gateway | 🧠 AI engine |
| `gateway.roadfx.biz.id` | Gateway | 🌐 API gateway |
| `api.roadfx.biz.id` | Gateway | ⚡ API endpoint |
| `auth.roadfx.biz.id` | Gateway | 🔐 Auth endpoints |
| `factory.roadfx.biz.id` | Gateway | 🏭 CF AI factory |
| `webhook.roadfx.biz.id` | Gateway | 🔗 Webhook receiver |
| `r2.roadfx.biz.id` | Gateway | 💾 R2 explorer |
| `app.roadfx.biz.id` | Redirect | 📱 Links hub |

---

## 🤖 AI Models (16 Available)

| Model | Provider | Speed | Thinking |
|---|---|---|---|
| `llama-3.3-70b-versatile` | Groq | ⚡ Fast | — |
| `llama-3.1-8b-instant` | Groq | ⚡ Fast | — |
| `qwen/qwen3-32b` | OpenRouter | 🧠 Medium | ✅ |
| `qwen/qwen3-235b-a22b` | OpenRouter | 🐢 Slow | — |
| `qwen/qwen3.6-27b` | OpenRouter | 🧠 Medium | ✅ |
| `openai/gpt-4o` | OpenRouter | 🧠 Medium | — |
| `openai/gpt-oss-120b` | OpenRouter | 🐢 Slow | — |
| `deepseek/deepseek-r1` | OpenRouter | 🐢 Slow | ✅ |
| `meta-llama/llama-4-scout-17b-16e-instruct` | OpenRouter | 🧠 Medium | — |
| `google/gemini-2.5-flash` | Google | ⚡ Fast | — |
| `google/gemini-2.5-pro-preview` | Google | 🐢 Slow | — |
| `gpt-4.1` | OpenAI Direct | 🧠 Medium | — |
| `gpt-4.1-mini` | OpenAI Direct | ⚡ Fast | — |
| `gpt-4o` | OpenAI Direct | 🧠 Medium | — |
| `o3-mini` | OpenAI Direct | 🧠 Medium | — |
| `o4-mini` | OpenAI Direct | 🧠 Medium | — |

**Fallback chain:** OpenAI → Groq → OpenRouter → Gemini

> **Smart routing:** Unprefixed models like `gpt-4o` use OpenAI direct (if `OPENAI_KEY` is set), while `openai/gpt-4o` always uses OpenRouter. Use `openai-direct/` prefix to force OpenAI direct.

---

## 📁 Project Structure

```
rocspace/
├── packages/
│   └── shared/
│       └── src/index.ts          — AI_MODELS, DOMAIN_MAP, ENDPOINTS, utilities
│
├── workers/
│   ├── site/
│   │   └── src/index.ts          — Unified router (ALL 14 domains)
│   │                                 Routes: ai→Gateway, chat→CloudRun, etc.
│   │
│   └── gateway/
│       └── src/
│           ├── types.ts          — Env interface, COMPONENTS, VERSION
│           ├── utils.ts          — isAuthed, json, cors, secHTML, reqMeta
│           ├── ai.ts             — AI dispatcher (Groq→OpenRouter→Gemini)
│           ├── solace.ts         — PubSub+ emit, status, queues
│           ├── clerk.ts          — Auth config, verify, user lookup
│           ├── crawl.ts          — Crawl4AI + simple crawl
│           ├── logs.ts           — KV + D1 activity logging
│           ├── index.ts          — Entry point, routing, page renderers
│           └── pages/
│               ├── chat.html     — 78KB Full AI chat UI
│               ├── dashboard.html— 15KB Realtime dashboard
│               ├── logs.html     — 13KB Activity log viewer
│               ├── crew.html     —  9KB CrewAI orchestration
│               ├── crawl.html    —  3KB Crawl4AI interface
│               └── zapier.html   —  3KB Zapier template
│
├── scripts/
│   └── deploy-worker.mjs         — Build + ESM multipart deploy
│
├── .env.example                  — Documented env vars
├── STATUS.md                     — Infrastructure status report
└── turbo.json                    — Turborepo config
```

---

## 🔌 Gateway API Endpoints

### Public (no auth)

| Endpoint | Method | Description |
|---|---|---|
| `/` `/api` | GET | Gateway info (JSON) |
| `/dashboard` | GET | Dashboard UI |
| `/chat-live` | GET | Chat-Live AI UI |
| `/crew` | GET | CrewAI UI |
| `/crawl4ai` | GET | Crawl4AI UI |
| `/zapier` | GET | Zapier template UI |
| `/logs` | GET | Activity logs UI |
| `/v1/models` | GET | Model list (OpenAI format) |
| `/auth/clerk-config` | GET | Clerk publishable config |
| `/auth/firebase-config` | GET | Firebase config |
| `/solace/status` | GET | Solace broker status |
| `/solace/queues` | GET | Queue list + stats |
| `/ai/chat` | POST | AI chat (non-stream) |
| `/ai/stream` | POST | AI chat (SSE streaming) |
| `/notify` | POST | Owner notification via Solace |

### Protected (Bearer token required)

| Endpoint | Method | Description |
|---|---|---|
| `/v1/chat/completions` | POST | OpenAI-compatible API |
| `/crawl4ai` | POST | Crawl URL → markdown |
| `/crawl` | POST | Simple crawl |
| `/logs/list` | GET | Activity log entries |
| `/solace/publish` | POST | Publish to Solace topic |
| `/solace/task` | POST | Send task to agent |
| `/webhook/zapier` | POST | Zapier webhook |

Auth: `Authorization: Bearer <TOKEN>`

---

## 🖥️ Infrastructure

| Component | Details | Status |
|---|---|---|
| **roc-site** (CF Worker) | Unified router, 18.7KB ESM, 14 domains | 🟢 Active |
| **hermes-cloudflare** (CF Worker) | AI gateway, 144KB ESM, v17.0.0, 27 secret bindings | 🟢 Active |
| **Cloud Run** (GCP) | ai-vitality, us-west1, v15.4 | 🟢 Active |
| **Oracle Cloud VM** | VM.Standard3.Flex, Singapore, 1CPU/16GB | 🟢 Running |
| **PostgreSQL** | PG 17 on Oracle VM (Docker) | 🟢 Healthy |
| **Redis** | Redis 7.4 on Oracle VM (Docker) | 🟢 Healthy |
| **Uptime Kuma** | Port 3001 on Oracle VM | 🟢 Healthy |
| **Nginx Proxy Manager** | Port 8080/8443/8181 on Oracle VM | 🟢 Healthy |
| **Tailscale** | VPN mesh, 4 nodes | 🟢 Connected |
| **Solace PubSub+** | Singapore, 5 queues | 🟢 Connected |
| **Aiven PostgreSQL** | AWS Jakarta, business-8, HA | 🟢 Running |
| **Clerk Auth** | 8 social logins, 21 origins | 🟢 Active |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- npm ≥ 11
- Cloudflare account with Workers

### Install & Build

```bash
git clone https://github.com/ivansslo/rocspace.git
cd rocspace
npm install

# Build site worker
npx esbuild workers/site/src/index.ts --bundle --format=esm --target=es2022 \
  --outfile=workers/site/dist/index.mjs \
  --alias:@rocspace/shared=./packages/shared/src/index.ts

# Build gateway worker (includes HTML pages)
npx esbuild workers/gateway/src/index.ts --bundle --format=esm --target=es2022 \
  --outfile=workers/gateway/dist/index.mjs \
  --alias:@rocspace/shared=./packages/shared/src/index.ts \
  --loader:.html=text
```

### Deploy

```bash
# Using deploy script (builds + deploys)
CF_API_TOKEN=your_token node scripts/deploy-worker.mjs site --esm
CF_API_TOKEN=your_token node scripts/deploy-worker.mjs gateway --esm
```

### Worker Name Mapping

| Argument | CF Worker Name |
|---|---|
| `site` | `roc-site` |
| `gateway` | `hermes-cloudflare` |

---

## 🔐 Security

- **All secrets** are stored as Cloudflare `secret_text` bindings — never in source code
- **27 secret bindings** on hermes-cloudflare (preserved across deployments)
- **Auto-auth** — roc-site injects `GATEWAY_TOKEN` for AI routes, no manual setup needed
- **CSP headers** on HTML pages (strict CSP with `unsafe-inline` + `https:`)
- **.env.example** documents required variables — copy to `.env` and fill in values

> ⚠️ Never commit `.env`, `*.pem`, or `*.key` files. See `.gitignore` for the full list.

---

## 📊 Oracle Cloud VM

| Property | Value |
|---|---|
| Shape | VM.Standard3.Flex (x86_64) |
| Region | ap-singapore-1 |
| Public IP | 161.118.253.28 |
| Tailscale IP | 100.93.139.73 |
| OS | Ubuntu 24.04.4 LTS |
| CPU / RAM | 1 OCPU / 16 GB |
| Disk | 45 GB |

**Docker containers:**
- `rocspace-pg` — PostgreSQL 17 Alpine (port 5432)
- `rocspace-redis` — Redis 7.4 (port 6379)
- `rocspace-monitor` — Uptime Kuma (port 3001)
- `rocspace-npm` — Nginx Proxy Manager (ports 8080/8443/8181)

---

## 🔄 Changelog

### v17.1.1 — OpenAI Routing Fix
- Fixed: `openai/gpt-4o` now correctly routes to OpenRouter (was going to OpenAI Direct)
- Only unprefixed models (e.g. `gpt-4o`) use OpenAI Direct when `OPENAI_KEY` is set
- `openai-direct/` prefix forces OpenAI Direct
- OPENAI_KEY secret binding set on hermes-cloudflare

### v17.1.0 — OpenAI Direct
- **OpenAI Direct provider** added — `OPENAI_KEY` env binding
- 5 OpenAI models: `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, `o3-mini`, `o4-mini`
- Smart routing: unprefixed → OpenAI direct, `openai/` prefix → OpenRouter
- `openai-direct/` prefix for explicit routing
- Fallback chain: OpenAI → Groq → OpenRouter → Gemini
- Total models: 16

### v17.0.0 — Unified Router
- **All 14 domains** consolidated to `roc-site` (previously split across 7 workers)
- Enhanced roc-site with full subdomain routing (ai, gateway, api, auth, factory, webhook, r2, app)
- Updated DOMAIN_MAP: all worker fields → `site`
- Updated dashboard and status pages for unified architecture
- Fixed gateway links hub → `app.roadfx.biz.id`

### v16.1.0 — Full HTML Pages
- 6 full HTML pages migrated from 159KB monolith
- `/auth/firebase-config` endpoint added
- Oracle VM routes (/vm, /monitor) in roc-site
- 11 verified AI models

---

## 📝 License

Private repository — © RoadFX AI 2026

## 🎨 New Modern UI Templates (v18.0.0)

RocSpace now ships beautiful, production-ready HTML UIs:

| File | Purpose | Location |
|------|---------|----------|
| `ui-templates/rocspace-dashboard.html` | Full Infrastructure Xloud dashboard | Served at `/ui/dashboard-v18.html` |
| `ui-templates/orchestrator-live.html` | Live Planner→...→Grounding UI | `/ui/orchestrator.html` |
| `ui/roc-containers-ui.html` | Modern terminal-style container UI | In roc-containers |

**Access after deploy:**
- https://gateway.roadfx.biz.id/ui/dashboard-v18.html
- https://gateway.roadfx.biz.id/ui/orchestrator.html

These templates are **first-class** for the new Autonomous Orchestrator + AIS-DEV experience.

