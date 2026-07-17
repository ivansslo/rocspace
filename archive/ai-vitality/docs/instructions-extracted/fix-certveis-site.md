# 🔧 Fix app.certveis.site (& Semua *.certveis.site)

## ❌ Masalah
Domain `certveis.site` nameserver-nya berubah ke `dns-expired.com` — Hostinger reset NS setelah auto-renew.

**Akibat:** SEMUA subdomain (`app`, `ai`, `factory`, `webhook`, `api`, `links`, `auth`, `surf`) → TLS error, tidak bisa diakses.

**Workers.dev tetap jalan normal** ✅

## ✅ Solusi — Set Nameserver di Hostinger

### Step 1: Login Hostinger
Buka: https://hpanel.hostinger.com/domains/certveis.site/dns

### Step 2: Change Nameservers
1. Pilih **"Change nameservers"** atau **"Use custom nameservers"**
2. Set ke:
   ```
   NS1: paris.ns.cloudflare.com
   NS2: vern.ns.cloudflare.com
   ```
3. Save/Apply

### Step 3: Tunggu Propagasi
- Biasanya 5-30 menit
- Bisa cek di: https://dnschecker.org/#NS/certveis.site
- Harus muncul `paris.ns.cloudflare.com` & `vern.ns.cloudflare.com`

### Step 4: Verifikasi
```bash
# Test setelah NS propagasi
curl -s https://app.certveis.site | head -5
curl -s https://ai.certveis.site/health
curl -s https://factory.certveis.site/models | head -5
```

## 📊 Status Worker Routes & Custom Domains
| Subdomain | Metode | Worker | Status |
|---|---|---|---|
| app.certveis.site | Custom Domain ✅ | rocspace-links | Siap (perlu NS fix) |
| ai.certveis.site | Worker Route ✅ | hermes-cloudflare | Siap (perlu NS fix) |
| factory.certveis.site | Worker Route ✅ | cf-ai | Siap (perlu NS fix) |
| webhook.certveis.site | Worker Route ✅ | hermes-webhook | Siap (perlu NS fix) |
| links.certveis.site | Worker Route ✅ | rocspace-links | Siap (perlu NS fix) |
| auth.certveis.site | Custom Domain ✅ | openauth-certve | Siap (perlu NS fix) |
| surf.certveis.site | Custom Domain ✅ | spring-surf-48a2 | Siap (perlu NS fix) |

## ⚡ Sementara (Backup URLs)
Semua worker tetap bisa diakses via `*.workers.dev`:
- 💬 Chat: https://hermes-cloudflare.certveis.workers.dev/chat
- 🔗 Links: https://rocspace-links.certveis.workers.dev
- 🏭 Factory: https://cf-ai.certveis.workers.dev/models
- 🪝 Webhook: https://hermes-webhook.certveis.workers.dev/chat
