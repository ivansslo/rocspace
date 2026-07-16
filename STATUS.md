# RocSpace Infrastructure Status Report
**Updated:** 2026-07-16 · **Gateway:** v17.1.1 · **Site:** v17.2.0

---

## 🟢 v17.2.0 — WebVirtCloud + Firebase Auth

### What Changed in v17.2.0
- **WebVirtCloud** deployed on Oracle VM (Docker, `linkease/webvirtcloud`)
- **Firebase Auth** integrated — Google Sign-in for VM Console
- **VM Console** accessible at `https://vm.roadfx.biz.id` and `https://roadfx.biz.id/vm`
- **Uptime Monitor** accessible at `http://161.118.253.28/monitor/`
- **16 domains** now mapped to roc-site (added vm.roadfx.biz.id, monitor.roadfx.biz.id)
- roc-site Worker serves Firebase bridge page directly (no proxy needed for auth page)
- WebVirtCloud iframe loads from Oracle VM port 80 (Nginx reverse proxy)

### WebVirtCloud Configuration
- **Docker container:** `rocspace-wvc` (linkease/webvirtcloud:latest)
- **Ports:** 8090 (HTTP), 6080 (noVNC)
- **Admin credentials:** admin / rocspace2026
- **Firebase project:** rofai-agent
- **Firebase Auth:** Google Sign-in enabled
- **Nginx routing on VM:**
  - `/vm/` → Firebase bridge page (local HTML)
  - `/vm/wvc/` → WebVirtCloud reverse proxy
  - `/monitor/` → Uptime Kuma reverse proxy
  - `/health` → VM health check

---

## 🟢 v17.1.1 — OpenAI Routing Fix

### What Changed in v17.1.1
- Fixed routing: `openai/gpt-4o` → OpenRouter (was incorrectly going to OpenAI Direct)
- Only unprefixed models (e.g. `gpt-4o`) route to OpenAI Direct when `OPENAI_KEY` is set
- `openai-direct/` prefix forces OpenAI Direct
- All 5 providers confirmed active: groq ✅ gemini ✅ openrouter ✅ openai ✅ clerk ✅
- OpenAI billing quota exceeded — fallback to OpenRouter working

---

## 🟢 v17.1.0 — OpenAI Direct + 16 Models

### What Changed in v17.1.0
- **OpenAI Direct provider** added to Gateway — `OPENAI_KEY` env binding
- 5 OpenAI models added: `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, `o3-mini`, `o4-mini`
- Smart routing: unprefixed → OpenAI direct (if key set), `openai/` prefix → OpenRouter
- `openai-direct/` prefix for explicit direct routing
- Fallback chain: OpenAI → Groq → OpenRouter → Gemini
- Provider status now includes `openai` field
- Total models: 16 (5 OpenAI + 2 Groq + 5 OpenRouter + 2 Google + 2 Groq)

---

## 🟢 v17.0.0 — UNIFIED ROUTER (All Domains → roc-site)

Major architecture change: all 16 domains now route through a single `roc-site` worker.

### 16 Domain Routes — All → roc-site (Unified)

| Domain | Routes To | Status |
|---|---|---|
| `roadfx.biz.id` | Dashboard | ✅ 200 |
| `www.roadfx.biz.id` | Dashboard | ✅ 200 |
| `dashboard.roadfx.biz.id` | CloudRun Dashboard | ✅ 200 |
| `chat.roadfx.biz.id` | CloudRun Chat-Live | ✅ 200 |
| `status.roadfx.biz.id` | Status page | ✅ 200 |
| `cloudrun.roadfx.biz.id` | CloudRun proxy | ✅ 200 |
| `ai.roadfx.biz.id` | Gateway (AI) | ✅ 200 |
| `gateway.roadfx.biz.id` | Gateway (API) | ✅ 200 |
| `api.roadfx.biz.id` | Gateway (API) | ✅ 200 |
| `auth.roadfx.biz.id` | Gateway (Auth) | ✅ 200 |
| `factory.roadfx.biz.id` | Gateway (CF AI) | ✅ 200 |
| `webhook.roadfx.biz.id` | Gateway (Webhook) | ✅ 200 |
| `r2.roadfx.biz.id` | Gateway (R2) | ✅ 200 |
| `app.roadfx.biz.id` | Links Hub → redirect | ✅ 302 |
| `vm.roadfx.biz.id` | VM Console (Firebase) | ✅ 200 |
| `monitor.roadfx.biz.id` | Uptime Monitor | ✅ 302 |

---

## 🗂️ Oracle Cloud VM Services

| Container | Port | Status | Purpose |
|---|---|---|---|
| rocspace-pg | 5432 | ✅ Healthy | PostgreSQL 17 |
| rocspace-redis | 6379 | ✅ Healthy | Redis 7.4 |
| rocspace-monitor | 3001 | ✅ Healthy | Uptime Kuma |
| rocspace-npm | 8080/8443/8181 | ✅ Running | Nginx Proxy Manager |
| rocspace-wvc | 8090/6080 | ✅ Running | WebVirtCloud + noVNC |

---

## 🔑 Quick Reference

- **VM Console:** `https://vm.roadfx.biz.id` or `https://roadfx.biz.id/vm`
- **Monitor:** `http://161.118.253.28/monitor/`
- **WVC Admin:** admin / rocspace2026
- **Firebase Project:** rofai-agent
- **Gateway URL:** `https://ai.roadfx.biz.id`
- **Chat-Live:** `https://chat.roadfx.biz.id`
- **Auth Token:** Bearer `hk-rocspace-2026`
- **Default Model:** `llama-3.3-70b-versatile` (Groq)
- **Deploy command:** `node scripts/deploy-worker.mjs gateway`
- **CF Account:** `37c44b4d3f192a627d20e46bdf910e79`

---

## ⚠️ Remaining Issues

| Issue | Priority | Notes |
|---|---|---|
| Firebase authorized domains | High | Need to add vm.roadfx.biz.id, 161.118.253.28 in Firebase Console |
| CLERK_SECRET_KEY in Cloud Run | Medium | Still pk_test_, should be sk_test_ |
| Oracle VM cost | Medium | VM.Standard3.Flex ~$39/mo, A1.Flex (free) still out of capacity |
| Cloud Run version | Phase 3+ | Still v15.4 from AI Studio |
| DNS A records | Low | vm/monitor subdomains need AAAA 100:: in CF DNS (cfat token lacks Zone permission) |
| OpenAI billing | Low | Quota exceeded, fallback to OpenRouter works |
