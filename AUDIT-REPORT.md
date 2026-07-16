# RocSpace Infrastructure — Full Audit Report
**Date:** 2026-07-16 · **Site:** v17.2.0 · **Gateway:** v17.1.1

---

## ✅ WORKING (12/16 domains fully operational)

| Domain | Status | Target | Notes |
|---|---|---|---|
| roadfx.biz.id | ✅ 200 | Dashboard | RocSpace unified dashboard |
| www.roadfx.biz.id | ✅ 200 | Dashboard | Same as root |
| status.roadfx.biz.id | ✅ 200 | Status page | Auto-refresh, 11 services |
| ai.roadfx.biz.id | ✅ 200 | Gateway | 16 AI models, 5 providers |
| gateway.roadfx.biz.id | ✅ 200 | Gateway | API endpoint |
| api.roadfx.biz.id | ✅ 200 | Gateway | API endpoint |
| auth.roadfx.biz.id | ✅ 200 | Gateway | Clerk + Firebase auth |
| factory.roadfx.biz.id | ✅ 200 | Gateway | CF AI Factory |
| webhook.roadfx.biz.id | ✅ 200 | Gateway | Webhook endpoint |
| r2.roadfx.biz.id | ✅ 200 | Gateway | R2 Explorer |
| app.roadfx.biz.id | ✅ 302 | Links Hub | Redirects to /links |
| vm.roadfx.biz.id | ✅ 200 | VM Console | Firebase bridge page + WVC |

## ⚠️ PARTIALLY WORKING (2 domains)

| Domain | Status | Issue | Fix |
|---|---|---|---|
| monitor.roadfx.biz.id | ⚠️ 302 | Redirects to HTTP IP | Need DNS AAAA record + NPM SSL |
| roadfx.biz.id/vm | ✅ 200 | WVC iframe loads HTTP | Secure via NPM SSL later |

## ❌ BROKEN (3 domains → CloudRun 404)

| Domain | Status | Issue | Fix |
|---|---|---|---|
| dashboard.roadfx.biz.id | ❌ 404 | CloudRun down | Redeploy or fix CloudRun |
| chat.roadfx.biz.id | ❌ 404 | CloudRun down | Redeploy or fix CloudRun |
| cloudrun.roadfx.biz.id | ❌ 404 | CloudRun down | GCP billing issue (OR_BACR2_44) |

---

## Oracle Cloud VM — All Services Running

| Container | Status | Port(s) | Purpose |
|---|---|---|---|
| rocspace-wvc | ✅ Up | 8090, 6080 | WebVirtCloud + noVNC |
| rocspace-pg | ✅ Healthy | 5432 | PostgreSQL 17 |
| rocspace-redis | ✅ Healthy | 6379 | Redis 7.4 |
| rocspace-monitor | ✅ Healthy | 3001 | Uptime Kuma |
| rocspace-npm | ✅ Up | 8080, 8443, 8181 | Nginx Proxy Manager |

**External ports open:** 80 (Nginx), 8080 (NPM) — all others closed (routed through Nginx)

---

## AI Models (16 total, 4 providers)

| Provider | Models | Status |
|---|---|---|
| Groq | llama-3.3-70b-versatile, llama-3.1-8b-instant | ✅ Working |
| OpenRouter | qwen3-32b, qwen3-235b, qwen3.6-27b, gpt-4o, gpt-oss-120b, deepseek-r1, llama-4-scout | ✅ Working |
| Google | gemini-2.5-flash, gemini-2.5-pro-preview | ✅ Working |
| OpenAI Direct | gpt-4.1, gpt-4.1-mini, gpt-4o, o3-mini, o4-mini | ⚠️ Quota exceeded |

---

## Auth Services

| Service | Config | Status |
|---|---|---|
| Clerk | 25 origins, 1 user, instance active | ✅ Updated (added vm, monitor, VM IP) |
| Firebase (rofai-agent) | Configured on Gateway, Google Sign-in | ⚠️ Needs authorized domains in Console |

---

## Action Items

### 🔴 HIGH — Manual Steps Required

1. **Firebase Authorized Domains** (MUST do manually):
   - Go to [Firebase Console](https://console.firebase.google.com) → rofai-agent → Authentication → Settings → Authorized domains
   - Add: `vm.roadfx.biz.id`, `161.118.253.28`
   - Without this, Google Sign-in popup will reject from these origins

2. **CloudRun Down** (3 domains broken):
   - `dashboard`, `chat`, `cloudrun` subdomains all return 404
   - GCP billing issue OR_BACR2_44 — debit card rejected
   - Need to fix billing or redeploy CloudRun service

### 🟡 MEDIUM

3. **OpenAI Billing**: Quota exceeded, need to top up at platform.openai.com
4. **DNS AAAA Records**: Add `vm` and `monitor` → `100::` in Cloudflare DNS (cfat lacks Zone permission)
5. **Oracle VM Cost**: ~$39/mo, A1.Flex (Always Free) still unavailable

### 🟢 LOW

6. **Port 443** on Oracle VM: Add to OCI Security List + configure NPM SSL
7. **CloudRun CLERK_SECRET_KEY**: Still pk_test_ instead of sk_test_
8. **CloudRun version**: Still v15.4, needs migration to rocspace monorepo

---

## WebVirtCloud + Firebase Integration

| Component | Status | Details |
|---|---|---|
| WVC Container | ✅ | linkease/webvirtcloud, port 8090/6080 |
| WVC Admin Login | ✅ | admin / rocspace2026 |
| Firebase Bridge Page | ✅ | Served from Worker (vm.roadfx.biz.id) |
| Firebase SDK | ✅ | firebase-app.js, firebase-auth.js loaded |
| Google Auth Provider | ✅ | GoogleAuthProvider configured |
| Clerk Origins | ✅ | vm.roadfx.biz.id, monitor.roadfx.biz.id, VM IP added |
| Firebase Auth Domains | ⚠️ | NEED MANUAL ADD in Firebase Console |
| KVM Module | ✅ | kvm_intel loaded on Oracle VM |
| noVNC | ✅ | Port 6080 (via Nginx /vm/novnc/) |
