# 🚀 ROADFX Full Stack

**Event-driven multi-agent AI orchestration platform** — deploys to EXISTING Cloudflare Workers + Firebase + Solace.

## 🏗️ Architecture

```
USERS (Chat UI / REST API / Webhook / Zapier)
           ↓
   EXISTING Cloudflare Workers (5 Workers)
   ├── hermes-cloudflare  → Main Gateway (158KB, 25+ endpoints)
   ├── hermes-webhook     → Mirror
   ├── certve-webhook     → Backup
   ├── cf-ai-factory      → CF AI Factory (60 models)
   └── rocspace-links     → Links Hub
           ↓
   Express Backend (TypeScript)
   ├── AI Routes (Groq, Gemini, OpenRouter)
   ├── Solace Routes (Event Mesh)
   ├── CrewAI Routes (Multi-agent)
   ├── Firebase (planning-with-ai-36675)
   └── Voyage AI (Embeddings → MongoDB)
           ↓
   Solace PubSub+ Event Mesh (Singapore)
   MongoDB Atlas (Voyage embeddings + chat history)
   Clerk Auth (8 social logins)
```

## 📊 Stats

| Metric | Count |
|--------|-------|
| CF Workers | 5 (existing, no new) |
| AI Models | 77+ |
| API Endpoints | 25+ |
| Solace Queues | 5 |
| Firebase Project | planning-with-ai-36675 |

## 🌐 Live Endpoints (Existing Workers)

| Worker | URL | Purpose |
|--------|-----|---------|
| hermes-cloudflare | `hermes-cloudflare.certveis.workers.dev` | Main Gateway |
| hermes-webhook | `hermes-webhook.certveis.workers.dev` | Mirror |
| certve-webhook | `certve-webhook.certveis.workers.dev` | Backup |
| cf-ai-factory | `cf-ai.certveis.workers.dev` | CF AI (60 models) |
| rocspace-links | `rocspace-links.certveis.workers.dev` | Links Hub |

### Custom Domains
| Domain | Worker |
|--------|--------|
| `ai.certveis.space` | hermes-cloudflare |
| `factory.certveis.space` | cf-ai-factory |
| `app.certveis.space` | rocspace-links |
| `webhook.certveis.space` | hermes-webhook |

## 🛠️ Setup

```bash
# Install
npm install

# Copy env
cp .env.example .env
# Fill in your secrets

# Run dev server
npm run dev

# Deploy to EXISTING workers
cd cloudflare-workers/main && wrangler deploy
cd cloudflare-workers/main && wrangler deploy --env webhook
cd cloudflare-workers/cf-ai-factory && wrangler deploy
```

## 🔥 Firebase Integration

Project: `planning-with-ai-36675`

```typescript
// Server-side (Express)
POST /api/save-chat    → Save to Firestore
GET  /api/chat-history → Fetch from Firestore
GET  /api/firebase-config → Get web config

// Client-side
import { initializeApp } from "firebase/app";
const config = await fetch('/api/firebase-config').then(r => r.json());
const app = initializeApp(config);
```

## 🔌 API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/workers` | List all existing workers |
| GET | `/api/firebase-config` | Firebase web config |
| POST | `/api/save-chat` | Save chat to Firestore |
| GET | `/api/chat-history` | Get chat history |
| GET | `/gateway/*` | Proxy to hermes-cloudflare |
| GET | `/api/ai/models` | AI model list |
| POST | `/api/ai/chat` | AI chat |
| GET | `/api/solace/status` | Solace broker status |

## 🚫 DEPRECATED

| Worker | Action |
|--------|--------|
| `roadfx-gateway` | DELETE — use `hermes-cloudflare` instead |
| `roadfx-cf-ai` | DELETE — use `cf-ai-factory` instead |

## 📄 License

Private project by Ivan Ssl (ivansslo).
