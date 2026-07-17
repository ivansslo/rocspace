# Solace Hermes Integrations — v15.1

## Live endpoints

- Chat UI: https://hermes-cloudflare.certveis.workers.dev/chat
- CrewAI UI: https://hermes-cloudflare.certveis.workers.dev/crew
- Hub: https://rocspace-links.certveis.workers.dev
- API root/status: https://hermes-cloudflare.certveis.workers.dev/
- Integrations JSON: https://hermes-cloudflare.certveis.workers.dev/integrations
- CF AI Factory: https://cf-ai.certveis.workers.dev

## Source code mirrors

- GitHub: https://github.com/ivansslo/Solace-Hermes-Project
- GitLab: https://gitlab.com/ivanssl/solace-hermes-project

## Component detail

| Component | Detail | Status |
|---|---|---|
| 🌐 5 CF Workers | v15.1, 25+ endpoints | Active |
| 💬 Chat | 12 models, 3 modes, Clerk auth slot | Active |
| 📡 Solace | Event mesh, 5 queues, Singapore | Connected |
| 🤖 CrewAI | v1.15.1 running di Termux | Running |
| ⚡ Zapier | Connected ke CrewAI webhook | Connected |
| 🎨 CF AI Factory | 60 public AI models | Active |
| 🔐 Clerk | 8 social logins | Configured |
| 📝 Notion | 45 tools via ClawLink | Active |
| 🕷️ Crawl4AI | `/crawl4ai` endpoint and `/crawl` command | Active |
| 🔗 20 integrations | ClawHub, ClawLink, Honcho, Solace, Zapier, Tailscale, Clerk, etc. | Active |
| 🌐 9 domains | certveis.space domain family | Mapped |
| 📦 4 repos synced | GitHub + GitLab mirrors | Synced |
| 📱 Termux CLI | `hermes run` works | Running |

## API checks

Use a browser-like User-Agent when testing from CLI because Cloudflare may challenge generic clients.

```bash
curl -A 'Mozilla/5.0' https://hermes-cloudflare.certveis.workers.dev/health
curl -A 'Mozilla/5.0' https://hermes-cloudflare.certveis.workers.dev/integrations
curl -A 'Mozilla/5.0' https://hermes-cloudflare.certveis.workers.dev/solace/status
```

Protected endpoints require:

```txt
Authorization: Bearer <TOKEN>
```

All runtime credentials are Cloudflare Worker Secrets, not committed to the repository.
