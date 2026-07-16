# RocSpace Infrastructure Status
> **Last Updated:** 2026-07-16 · **Version:** v17.3.1 (site) / v17.1.1 (gateway)

## 🟢 Active Services

| Service | Status | Details |
|---------|--------|---------|
| roc-site (CF Worker) | ✅ Active | v17.3.1 · 16 domains · unified router |
| hermes-cloudflare (CF Worker) | ✅ Active | v17.1.1 · 16 AI models · 5 providers |
| Oracle VM | ✅ Running | Singapore · 1CPU/16GB · Docker stack |
| WebVirtCloud | ✅ Running | Firebase Auth · signInWithRedirect |
| Uptime Kuma | ✅ Running | Port 3001 · via Nginx |
| PostgreSQL | ✅ Healthy | v17 Alpine · 4 tables |
| Redis | ✅ Healthy | v7.4 · port 6379 |
| Nginx Proxy Manager | ✅ Running | Port 8080 · no SSL yet |
| Clerk Auth | ✅ Active | 26 origins · 8 social logins |
| Firebase Auth | ✅ Active | yttriferous-magpie-16ppv |
| Solace PubSub+ | ✅ Connected | Singapore · 5 queues |
| Tailscale | ✅ Connected | 4 nodes (2 active) |

## 🔴 Down Services

| Service | Status | Issue |
|---------|--------|-------|
| CloudRun (ai-vitality) | ❌ DOWN | GCP billing OR_BACR2_44 |
| OpenAI Direct models | ⚠️ Quota | insufficient_quota error |

## 🌐 Domain Status (16 → roc-site)

| Domain | HTTP | Target |
|--------|------|--------|
| roadfx.biz.id | ✅ 200 | Dashboard |
| www.roadfx.biz.id | ✅ 200 | Dashboard |
| dashboard.roadfx.biz.id | ✅ 404→CloudRun | CloudRun (DOWN) |
| chat.roadfx.biz.id | ✅ 404→CloudRun | CloudRun (DOWN) |
| status.roadfx.biz.id | ✅ 200 | Status page |
| cloudrun.roadfx.biz.id | ✅ 404→CloudRun | CloudRun (DOWN) |
| ai.roadfx.biz.id | ✅ 200 | Gateway |
| gateway.roadfx.biz.id | ✅ 200 | Gateway |
| api.roadfx.biz.id | ✅ 200 | Gateway |
| auth.roadfx.biz.id | ✅ 200 | Gateway |
| factory.roadfx.biz.id | ✅ 200 | Gateway |
| webhook.roadfx.biz.id | ✅ 200 | Gateway |
| r2.roadfx.biz.id | ✅ 200 | Gateway |
| app.roadfx.biz.id | ✅ 200 | Gateway/Links |
| vm.roadfx.biz.id | ✅ 200 | Firebase bridge |
| monitor.roadfx.biz.id | ✅ 302 | → Oracle VM |

## 🤖 AI Models (16)

**Working (11):** llama-3.3-70b-versatile, llama-3.1-8b-instant, qwen/qwen3-32b, qwen/qwen3-235b-a22b, qwen/qwen3.6-27b, openai/gpt-4o, openai/gpt-oss-120b, deepseek/deepseek-r1, meta-llama/llama-4-scout-17b-16e-instruct, google/gemini-2.5-flash, google/gemini-2.5-pro-preview

**Quota Exceeded (5):** gpt-4.1, gpt-4.1-mini, gpt-4o (Direct), o3-mini, o4-mini

## 🔐 Security Audit

- ✅ No hardcoded secrets in source code
- ✅ All API keys via Cloudflare secret_text bindings (env.XXX)
- ✅ Firebase API key & Clerk PK = public browser keys (safe)
- ✅ Git remote URLs cleaned after push
- ⚠️ Oracle VM port 443 closed (no SSL)
- ⚠️ CloudRun CLERK_SECRET_KEY = pk_test_ (should be sk_test_)

## 📋 Pending Actions

1. Fix GCP billing (OR_BACR2_44) — manual GCP Console
2. Top up OpenAI billing
3. Setup auto-retry for A1.Flex (Always Free) VM
4. Configure SSL/HTTPS on Oracle VM
5. Get CF Zone/DNS token
6. Migrate CloudRun to rocspace monorepo
7. Rekonversi gateway/src/ ke proper TypeScript
