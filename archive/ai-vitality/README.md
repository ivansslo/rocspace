# 🚀 Solace Hermes Project

**AI Agent Hub** — Event-driven multi-agent orchestration platform powered by Cloudflare Workers + Solace PubSub+ Event Mesh.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    USERS                             │
│  Chat UI · REST API · Webhook · Zapier               │
└──────────────────┬──────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────┐
│  Cloudflare Workers (Gateway Layer)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ hermes-      │ │ hermes-      │ │ certve-      │ │
│  │ cloudflare   │ │ webhook      │ │ webhook      │ │
│  │ (primary)    │ │ (mirror)     │ │ (backup)     │ │
│  └──────┬───────┘ └──────────────┘ └──────────────┘ │
│         │  + cf-ai (AI Factory) + rocspace-links     │
└─────────┼────────────────────────────────────────────┘
          │
   ┌──────┴──────┐
   ▼              ▼
┌────────┐  ┌──────────────────────────────────────────┐
│ AI     │  │  Solace PubSub+ Event Broker              │
│ Models │  │  RoClace Cluster (Singapore)               │
│        │  │                                            │
│ Groq   │  │  Topics: hermes/task/* · hermes/response/* │
│ Gemini │  │  Queues: orchestrator · ai-chat · tools    │
│ OR     │  │          memory · events                   │
│ CF AI  │  └──────────────────────────────────────────┘
└────────┘           │
              ┌──────┴──────────────┐
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │ MongoDB  │         │ Honcho   │
        │ Atlas    │         │ Memory   │
        │ 3 DBs    │         │ 4 peers  │
        └──────────┘         └──────────┘
```

## 📊 Stats

| Metric | Count |
|---|---|
| AI Models | 77 (Groq 9 + Gemini 3 + OpenRouter 4 + CF AI 60) |
| Tools | 1019 (ClawLink) |
| Workers | 5 active |
| API Endpoints | 25+ |
| Queues | 5 (Solace) |
| Custom Domains | 4 (certveis.space) |

## 🌐 Live Endpoints

### Custom Domains (certveis.space)
| Domain | Worker | Purpose |
|---|---|---|
| `ai.certveis.space` | hermes-cloudflare | AI Gateway + Chat UI |
| `app.certveis.space` | rocspace-links | AI Agent Hub links page |
| `factory.certveis.space` | cf-ai | CF AI Factory (60 models) |
| `webhook.certveis.space` | hermes-webhook | Gateway mirror |

### Workers.dev (always available)
| URL | Purpose |
|---|---|
| `hermes-cloudflare.certveis.workers.dev` | Primary gateway |
| `hermes-webhook.certveis.workers.dev` | Mirror |
| `certve-webhook.certveis.workers.dev` | Backup |
| `cf-ai.certveis.workers.dev` | AI Factory |
| `rocspace-links.certveis.workers.dev` | Links page |

## 📁 Project Structure

```
Solace-Hermes-Project/
├── README.md                    # This file
├── cloudflare-gateway/
│   ├── worker.js                # Main gateway (v13.0-solace, 25 endpoints)
│   ├── worker-links.js          # AI Agent Hub links page
│   ├── worker-cfai.js           # CF AI Factory (image/tts/stt/embed/translate)
│   ├── index.html               # Standalone chat UI for local testing
│   └── wrangler.toml            # Cloudflare Workers config
├── config/
│   ├── config.yaml              # Full model/gateway/integration registry
│   └── .env.example             # Environment variables template
├── tools/
│   └── hermes.sh                # CLI management tool (41KB)
└── docs/
    ├── solace-setup.md          # Solace broker setup & credentials
    ├── solace-integration.md    # Integration details
    └── architecture.md          # Full architecture analysis
```

## 🔌 API Reference

### Chat & AI
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/chat` | — | Interactive chat UI |
| GET | `/v1/models` | — | LiteLLM-compatible model list |
| POST | `/v1/chat/completions` | Bearer | OpenAI-compatible chat API |
| POST | `/ai/chat` | Bearer | AI chat (auto-routes provider) |
| POST | `/ai/stream` | Bearer | Streaming chat |

### Solace Event Mesh
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/solace/status` | — | Broker connection status |
| GET | `/solace/queues` | — | Queue stats (spool, binds) |
| GET | `/solace/service` | — | Solace Cloud service info |
| POST | `/solace/publish` | Bearer | Publish event to any topic |
| POST | `/solace/task` | Bearer | Submit agent task (chat/crawl/tool) |

### Integrations
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/hub/*` | — | ClawHub proxy (skills, plugins) |
| GET | `/link/*` | — | ClawLink proxy (1019 tools) |
| POST | `/link/tools/:name/execute` | Bearer | Execute ClawLink tool |
| GET | `/skills` | — | SkillsLLM proxy |
| GET | `/honcho/peers` | — | Honcho peers list |
| POST | `/honcho/chat` | Bearer | Honcho memory-aware chat |
| POST | `/crawl` | Bearer | Web crawl → clean text |
| POST | `/webhook/zapier` | Bearer | Zapier webhook (crawl/chat/tool) |

### CF AI Factory (`cf-ai` worker)
| Method | Path | Description |
|---|---|---|
| POST | `/chat` | Text gen (Llama 70B, GPT-OSS 120B) |
| POST | `/image` | Image gen (Flux Schnell, SD XL) |
| POST | `/speech/tts` | Text-to-speech (MeloTTS) |
| POST | `/speech/stt` | Speech-to-text (Whisper) |
| POST | `/embed` | Embeddings (BGE-M3, 1024d) |
| POST | `/translate` | Translation (M2M100, 100+ langs) |
| POST | `/vision` | Image analysis (LLaVA) |
| GET | `/models` | List 60 CF AI models |

## 🔑 Authentication

All auth-required endpoints use Bearer token:
```
Authorization: Bearer <TOKEN>
```

Secrets are stored in Cloudflare Worker Secrets (14 per worker). Never hardcoded.

## 🛠️ Setup

### Prerequisites
- Cloudflare account with Workers
- Solace Cloud account (free tier)
- MongoDB Atlas cluster
- API keys for Groq, Gemini, OpenRouter

### Deploy
```bash
# Use hermes.sh CLI
chmod +x tools/hermes.sh
./tools/hermes.sh deploy
```

## 📄 License

Private project by Ivan Ssl (ivansslo).

## v15.1 Live Build

Primary live endpoints:

- Chat: `https://hermes-cloudflare.certveis.workers.dev/chat`
- CrewAI: `https://hermes-cloudflare.certveis.workers.dev/crew`
- Hub: `https://rocspace-links.certveis.workers.dev`
- API: `https://hermes-cloudflare.certveis.workers.dev/`
- Integrations JSON: `https://hermes-cloudflare.certveis.workers.dev/integrations`

Component summary:

- 🌐 **5 CF Workers** — v15.1, 25+ endpoints
- 💬 **Chat** — 12 models, 3 modes, Clerk auth slot
- 📡 **Solace** — event mesh, 5 queues, Singapore
- 🤖 **CrewAI** — v1.15.1 running in Termux
- ⚡ **Zapier** — connected to CrewAI
- 🎨 **CF AI Factory** — 60 public models
- 🔐 **Clerk** — 8 social logins
- 📝 **Notion** — 45 tools via ClawLink
- 🕷️ **Crawl4AI** — `/crawl4ai` endpoint
- 🔗 **20 integrations** — all active
- 🌐 **9 domains** — certveis.space domain family
- 📦 **4 repos synced** — GitHub + GitLab
- 📱 **Termux CLI** — `hermes run` works

See [`INTEGRATIONS.md`](./INTEGRATIONS.md) for detail.

### v15.2 Page Link Fix + Zapier

Chat start page is the main launcher:

- `https://hermes-cloudflare.certveis.workers.dev/chat`

Linked worker pages:

- Crawl4AI UI: `https://hermes-cloudflare.certveis.workers.dev/crawl4ai`
- Zapier Template UI: `https://hermes-cloudflare.certveis.workers.dev/zapier`
- Zapier Template JSON: `https://hermes-cloudflare.certveis.workers.dev/zapier/template`
- Links Hub redirect: `https://hermes-cloudflare.certveis.workers.dev/links`
- Integrations JSON: `https://hermes-cloudflare.certveis.workers.dev/integrations`

Zapier best-practice template is documented in [`zapier/HERMES-CLERK-ZAPIER-TEMPLATE.md`](./zapier/HERMES-CLERK-ZAPIER-TEMPLATE.md).

### v15.3 Activity Logs

New log page:

- Logs UI: `https://hermes-cloudflare.certveis.workers.dev/logs`
- Logs JSON: `https://hermes-cloudflare.certveis.workers.dev/logs/list` (Bearer token)

Logged server-side events:

- `crawl4ai.start`
- `crawl4ai.success`
- `crawl4ai.extract`
- `crawl4ai.batch`
- `crawl.simple`
- `ai.chat`
- `ai.v1_chat`
- `zapier.webhook`
- `solace.publish`
- `solace.task`
- `honcho.chat`
- `notify`

Logs are emitted to:

1. Cloudflare Worker console logs.
2. Solace topics under `hermes/log/*`.
3. Optional KV binding `LOGS` if configured.

Client UI actions also store local browser logs in `localStorage` and can be viewed at `/logs`.

### v15.4 Realtime Dashboard

New control center:

- Dashboard UI: `https://hermes-cloudflare.certveis.workers.dev/dashboard`
- Dashboard JSON: `https://hermes-cloudflare.certveis.workers.dev/dashboard/status`

Dashboard shows:

- Worker map and quick links
- Model / integration / endpoint counts
- Provider secret configuration status
- Solace status and queue telemetry
- Recent log status
- Links to Chat, Crawl4AI, CrewAI, Zapier, Logs, Hub, CF AI, GitHub

Optional persistent server logs support both:

- `LOGS` KV binding
- `DB` D1 binding with table `logs(id,type,ts,meta,data)`

Without KV/D1, logs still emit to Cloudflare console and Solace topics `hermes/log/*`.

### v15.5 Dashboard Home + Clerk UI

Root behavior:

- Browser request to `/` opens the realtime dashboard.
- API clients can use `/api` for JSON gateway index.
- OpenAPI JSON: `/openapi.json` or `/api/openapi`.

Clerk support:

- Config endpoint: `/auth/clerk-config`
- Chat Profile page has `Login with Clerk` and `Open Profile` buttons.
- Successful Clerk sign-in triggers `/notify` and can be connected to Zapier template `/zapier`.

Recommended main entrypoint:

- `https://hermes-cloudflare.certveis.workers.dev/dashboard`
