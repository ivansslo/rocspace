# RocSpace Infrastructure Status
> **Last Updated:** 2026-07-17 · **Version:** v19.0.0 (site) / v18.0.3 (gateway)

## 🛰️ Hub Tunggal (v19.0.0 — 2026-07-17)

Satu situs kanonik untuk semua HALAMAN — **hub.roadfx.biz.id** — menggantikan
pola mirror 16 subdomain:

- 🔀 **Host lama → 301**: semua halaman (GET/HEAD non-fungsional) di host lama
  dialihkan permanen ke padanannya di hub (mis. `vm.` → `hub.roadfx.biz.id/vm`).
  Path dipertahankan, sehingga aset/deep-link lama tetap bekerja lewat hub.
- ⚡ **API tetap `api.roadfx.biz.id`** (sesuai keputusan). Host `api.`/`gateway.`/`ai.`
  = mesin murni, tidak disentuh lapisan 301.
- 🛠️ **Endpoint fungsional host lama tetap hidup**: `/health`, `/api/`, `/v1/`,
  `/ai/`, `/auth/`, `/gateway/`, `/webhook/`, `/cloudrun/`, `/crawl*`, `/notify*`,
  `/solace*`, `/.well-known/` — ditandai header `X-ROC-Deprecated-Host`, `X-ROC-Hub`,
  `Deprecation: true` (deprecated bertahap, opsi 3).
- 🏥 `/health` (bridge HTTPS → VM via raw TCP socket) kini **host-agnostic**:
  tersedia juga di `hub.roadfx.biz.id/health`.
- 🚀 Deploy (butuh token Workers:Edit): `npm run deploy:site` — Custom Domain
  `hub.roadfx.biz.id` dibuat otomatis oleh wrangler (lihat `workers/site/wrangler.toml`).
- ✅ Verifikasi pasca-deploy:
  `curl -sI https://vm.roadfx.biz.id/ | grep -i location` → `https://hub.roadfx.biz.id/vm`

## 🟢 Active Services

| Service | Status | Details |
|---------|--------|---------|
| roc-site (CF Worker) | ✅ Active | v19.0.0 · Hub Tunggal hub.roadfx.biz.id · host lama 301 |
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
7. Rekonversi gateway/src ke proper TypeScript ✅ **DONE (2026-07-16)**

## 🆕 Recent Work (Agent Session 2026-07-16)

- Cloned repo
- Read & updated HANDOFF.md
- Reconstructed `workers/gateway/src/` into **proper TypeScript modules** (index.ts, ai.ts, utils.ts, types.ts, clerk.ts, crawl.ts, logs.ts, solace.ts)
- Added build scripts (`scripts/build-*.mjs`)
- Updated `package.json` scripts for easy `npm run build` / `npm run deploy:gateway`
- Gateway + Site successfully built (147KB + 27KB ESM)
- Pages remain importable as text via esbuild loader
- Source now maintainable (no more bundled JS)
