# 🤝 HANDOFF — RocSpace Single Source

> **Updated:** 2026-07-17 · **Kebijakan:** SATU SOURCE = `ivansslo/rocspace`
> **Prinsip:** Tidak ada hardcode secret di repo. Titik.

---

## 1. Status versi (ringkas)

| Komponen | Versi | Lokasi |
|---|---|---|
| roc-site (CF Worker) | **v19.1.1 "Command Center"** | `workers/site/` |
| hermes-cloudflare (gateway) | v18.0.3 | `workers/gateway/` |
| shared constants | v19.1.1 (`CANONICAL`, `HUB_SECTIONS`) | `packages/shared/` |
| roc-containers (Termux) | v1.6.0 | repo `ivansslo/roc-containers` |
| hermes CLI | v5.13.1 "Oracle" | repo `ivansslo/roc-agentsroute` |
| Rofwin (Android) | v1.1.0 (NEW source, VC 110) | repo `ivansslo/Rofwin` |

## 2. Arsitektur kanonik (anti-mirror)

- **Halaman:** hanya `hub.roadfx.biz.id` (Command Center; probe status live sisi klien).
- **API mesin:** hanya `api.roadfx.biz.id` (bukan 301 — proxy penuh ke gateway; host `ai./gateway.` = alias mesin).
- **16 host lama** (`vm.`, `www.`, `app.`, `auth.`, `chat.`, `cloudrun.`, `dashboard.`, `factory.`, `monitor.`, `r2.`, `status.`, `webhook.` + apex `roadfx.biz.id`): halaman → **301** ke hub; prefix fungsional (`/api/ /v1/ /ai/ /auth/ /gateway/ /webhook/ /cloudrun/ /crawl* /notify* /solace* /.well-known/` + `/health`) tetap dilayani + header `X-ROC-Deprecated-Host`.
- `/health` host-agnostic (bridge raw-TCP ke Nginx VM — workaround CF error 1003).
- `/links` = **directory lokal** (gateway `/links` 522 berulang); `/ais` di hub → 302 applet resmi `rocspace.ai.studio`.
- Host `ais.`/`newcr.` sudah tidak punya DNS (mati permanen, tidak dibangkitkan).

## 3. Single source & arsip

Empat repo **DIHAPUS** (2026-07-17, HTTP 204 → 404): `Solace-Hermes-Project`, `ai-vitality`, `roadfx-ai-stack`, `roadfx-full-stack`.
Snapshot non-aktif tersimpan di **`archive/<nama>/`** (file `.SNAPSHOT` = hash commit asal; nilai secret di dalam arsip **sudah di-scrub** `███████`).

## 4. Kanal deploy

1. **Langsung via CF API (primer, terbukti):**
   `CF_API_TOKEN=<Workers:Edit> CF_ACCOUNT_ID=<id> node scripts/deploy-worker.mjs site --esm`
   lalu `node scripts/post-deploy-site.mjs` (ensure custom domain hub + re-put `GATEWAY_TOKEN` bila tersedia).
2. **GitHub Actions** (`.github/workflows/deploy-workers.yml`): secrets dibaca dari **Environment `deploy`** (`CF_API_TOKEN`, `CF_ACCOUNT_ID`; ops `CF_ZONE_ROADFX_BIZ_ID`, `GATEWAY_TOKEN`). Status: menunggu akun GitHub lepas dari **billing lock**.
3. **Termux manual** (cadangan): lihat blok perintah di changelog chat/README.

> ⚠️ **Catatan bindings:** upload multipart memakai `bindings: []` — secret bindings **bertahan** (terverifikasi `GATEWAY_TOKEN` tidak terhapus), tapi selalu jalankan `post-deploy-site.mjs` sebagai pengaman.

## 5. 🛡️ Papan rotasi paparan (GitHub + history chat)

| Item | Terpapar di | Status | Aksi |
|---|---|---|---|
| Kunci **Groq** `gsk_…` | repo `roadfx-full-stack` (dihapus) | 🔴 ANGGAP BOCOR | **ROTATE** di console.groq.com |
| Kunci **OpenRouter** `sk-or-…` | repo `roadfx-full-stack` (dihapus) | 🔴 ANGGAP BOCOR | **ROTATE** di openrouter.ai/keys |
| **Cloudflare User API Token** | repo `roadfx-full-stack` (dihapus) | 🔴 ANGGAP BOCOR | **ROTATE** (template Workers:Edit), lalu perbarui env/Actions |
| **OpenSSH private key** (`render_key`) | arsip `Solace-Hermes-Project` | ✅ di-scrub dari repo | **CABUT** di Render.com → buat baru |
| **GitHub PAT** `ghp_…` | dipakai di sesi kerja | ⚠️ rotasi berkala (pengingat #26) | github.com/settings/tokens |
| **Tailscale authkey** `tskey-auth-…` | history chat | 🔴 ANGGAP BOCOR | **REVOKE** di login.tailscale.com/admin/settings/keys |
| Tailscale **nodekey** `nxPykaDi4s11CNTRL` | history chat | 🟡 risiko rendah (key device) | opsional: hapus node `roc-vm` di admin |
| **CF Account ID** `37c44b…` | repo + Actions env | 🟡 risiko rendah (tanpa token = tak berguna) | — |
| IP VM `161.118.253.28` | repo + publik dasar | ⚪ by design (publik) | — |
| **Firebase web API keys** (2 proyek) | `workers/site`, `roc-containers`, `roc-agentsroute`, `webvirtcloud-firebase-*` | ⚪ **public-by-design** (Security Rules yang menjaga, BUKAN kunci) | aktifkan **Firebase App Check** + kunci Rules; jangan di-scrub (memutuskan VM console & tools) |
| Password zip backup kredensial | history chat | 🟡 lokal saja | enkripsi ulang zip dengan password baru bila file berpindah |
| Email pribadi pemilik tailnet | history chat | 🟡 privasi | tak bisa ditarik; sadari saja |

### Aturan repo (berlaku mulai v19.1.1)
1. **Tidak ada nilai secret di repo** — GitHub Push Protection aktif dan terbukti memblokir (kasus `SETUP_QUICK.md`).
2. Konfigurasi sensitif lewat env (`SECRETS-MASTER.env` lokal · Actions Environment `deploy`).
3. Scan sebelum push: `grep -rP "(gsk_|sk-or-|ghp_|AIza[0-9A-Za-z_-]{30}|tskey-|PRIVATE KEY)" .`

## 6. Antrian misi terbuka

1. 🔴 **OCI Console → Run Command** (pasang 2 SSH key ke `ubuntu@161.118.253.28`) → balas `Succeeded` → lanjut instalasi Antigravity (`vm/antigravity-vm-install.sh` siap).
2. **Termux**: Blok A `roc-update` (header menu harus v1.6.0).
3. **GCP trial $300**: link billing ke proyek · upgrade Blaze Firebase · budget alert · enable Generative Language API.
4. **GitHub billing lock** → Actions otomatis menyala begitu terbuka.

> Gagal SSH sampai kapan pun: satu-satunya penyebab tersisa adalah `authorized_keys` kosong di VM — BUKAN chmod di HP. Pintunya tetap Run Command.
