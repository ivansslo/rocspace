# ✅ Solace Hermes v15.0 — Clerk Auth Integrated

## 🔐 Clerk Authentication

### Apa yang ditambahkan:
| Fitur | Detail |
|---|---|
| **Login button** | Header chat → "Login" / 👤 (setelah login) |
| **8 social login** | GitHub, GitLab, Google, HuggingFace, Linear, LinkedIn, Notion, X |
| **User profile** | Klik 👤 → buka Clerk profile manager |
| **Owner notification** | Notif include nama + email user dari Clerk |
| **Backend verify** | `POST /auth/verify` — verify session token |
| **User lookup** | `GET /auth/user?id=xxx` — get user info |
| **Guest mode** | Chat tetap bisa tanpa login (Clerk optional) |

### Cara kerja:
1. User buka chat → Clerk JS loads
2. Jika belum login → tombol "Login" di header
3. Klik Login → Clerk popup (email/social)
4. Setelah login → nama user tampil, notif dikirim ke owner via Solace
5. Chat tetap berfungsi tanpa login (guest mode)

### Endpoints baru:
```
POST /auth/verify    — Verify Clerk session token
GET  /auth/user?id=  — Get user by Clerk ID
```

## 🔧 Gemini Pro OR
**Fixed ✅** — `max_tokens` minimum dinaikkan ke 2048 untuk reasoning models.
```
Response: "Hi there! How can I help you today?"
```

## 🛡️ Security Headers
Semua worker sekarang punya 6 security headers (CSP, X-Frame, XSS, nosniff, Referrer, Permissions).

## 📦 Credentials ZIP
Updated — sekarang include **27 credentials** termasuk Clerk PK + SK + Domain.

## 📊 v15.0 Stats
```
Workers:      5 active (16 secrets each)
Endpoints:    25+
Models:       12 chat + 60 CF AI
Integrations: 19 (+ Clerk)
Domains:      9 custom
Social login: 8 providers
Repos:        GitHub + GitLab synced
```

## 💬 Test:
**`hermes-cloudflare.certveis.workers.dev/chat`**

Login dengan GitHub/Google → chat → owner dapat notif! 🔔
