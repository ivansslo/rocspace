# Security Notes — Solace Hermes

## Prinsip yang dipakai

- Jangan hardcode API key/token di HTML, JavaScript frontend, atau Git repo.
- Semua credential provider disimpan sebagai Cloudflare Worker Secrets.
- Frontend hanya menyimpan token operator secara lokal di browser jika Anda isi manual di Settings.
- `.dev.vars`, `.env`, dan file credential lokal di-ignore oleh Git.

## Credential yang harus jadi Cloudflare Secrets

Set minimal:

```bash
TOKEN
GROQ_KEY
OR_KEY
GEMINI_KEY
CLAW_KEY
CLAWLINK_KEY
HONCHO_KEY
TAILSCALE_KEY
SOLACE_URL
SOLACE_USER
SOLACE_PASS
SOLACE_API_TOKEN
SOLACE_SEMP_URL
SOLACE_VIEW_USER
SOLACE_VIEW_PASS
CLERK_PK
CLERK_SK
```

Contoh SEMP URL:

```txt
https://<host-solace>:943
```

## Upload secrets aman

Export dari terminal lokal Anda, lalu jalankan script:

```bash
export TOKEN='isi-token-anda'
export GROQ_KEY='isi-key-anda'
# dst...
./scripts/set-worker-secrets.sh hermes-cloudflare
```

Untuk environment webhook:

```bash
./scripts/set-worker-secrets.sh hermes-webhook --env webhook
```

## Setelah deploy

```bash
cd cloudflare-gateway
npx wrangler deploy
```

Buka `/chat`, lalu isi token operator di:

```txt
Settings → Bearer token
```

Token itu hanya masuk `localStorage` browser Anda, bukan ditulis ke source code.

## Rekomendasi penting

Jika credential pernah terkirim ke chat, email, screenshot, atau file yang tidak terenkripsi, rotasi credential tersebut di dashboard provider masing-masing.
