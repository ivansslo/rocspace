# 🚀 ROADFX Quick Setup

## Prerequisites
- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account access

## Setup Secrets

Run this command for each secret:

```bash
# roadfx-gateway
wrangler secret put TOKEN --name roadfx-gateway
# Enter: hk-rocspace-2026

wrangler secret put GROQ_KEY --name roadfx-gateway
# Enter: ███████

wrangler secret put GEMINI_KEY --name roadfx-gateway
# Enter: ███████

wrangler secret put OR_KEY --name roadfx-gateway
# Enter: ███████

# cf-ai-factory
wrangler secret put TOKEN --name cf-ai-factory
wrangler secret put CF_AI_TOKEN --name cf-ai-factory
# Enter: ███████e4a0555a
```

## Add Custom Routes

1. Open Cloudflare Dashboard
2. Go to Workers & Pages
3. Select worker → Triggers → Routes
4. Add route: `api.roadfx.space/*` or your domain

## Test Endpoints

```bash
# hermes-cloudflare (existing)
curl https://hermes-cloudflare.certveis.workers.dev/health

# roadfx-gateway (new)
curl https://roadfx-gateway.37c44b4d3f192a627d20e46bdf910e79.workers.dev/health

# cf-ai-factory (new)
curl https://cf-ai-factory.37c44b4d3f192a627d20e46bdf910e79.workers.dev/models
```
