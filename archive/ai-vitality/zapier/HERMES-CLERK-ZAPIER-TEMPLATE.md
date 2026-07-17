# Zapier Template — Clerk → Solace Hermes

Template terbaik untuk koneksi Clerk yang sudah terhubung ke Zapier.

## Goal

Saat user login/register/update di Clerk, Zapier akan:

1. Normalize data user.
2. Kirim event ke Solace Hermes gateway.
3. Gateway publish audit event ke Solace topic `hermes/event/clerk`.
4. Opsional: generate AI welcome message.
5. Opsional: jalankan CrewAI onboarding task.
6. Opsional: create Notion record / kirim owner notification.

## Trigger

- App: **Clerk**
- Event pilihan:
  - User Created
  - User Updated
  - Session Created
  - Organization Membership Created, jika dipakai

## Action 1 — Formatter by Zapier

Normalize fields:

```txt
user_id       = Clerk user id
email         = primary email
name          = first_name + last_name
username      = username
image_url     = profile image
created_at    = created timestamp
event_type    = trigger event name
```

## Action 2 — Webhooks by Zapier: POST Clerk event to Hermes

Method:

```txt
POST
```

URL:

```txt
https://hermes-cloudflare.certveis.workers.dev/webhook/zapier
```

Headers:

```txt
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

Body JSON:

```json
{
  "action": "clerk_event",
  "event_type": "{{trigger.event}}",
  "email": "{{user.email}}",
  "user": {
    "id": "{{user.id}}",
    "name": "{{user.first_name}} {{user.last_name}}",
    "username": "{{user.username}}",
    "image": "{{user.image_url}}",
    "created_at": "{{user.created_at}}"
  }
}
```

Expected response:

```json
{
  "status": "received",
  "routed": "solace",
  "topic": "hermes/event/clerk"
}
```

## Action 3 Optional — AI welcome message

POST to same URL:

```json
{
  "action": "chat",
  "model": "llama-3.1-8b-instant",
  "prompt": "Create a concise Indonesian welcome message for {{user.email}} using Solace Hermes features."
}
```

## Action 4 Optional — CrewAI onboarding

```json
{
  "action": "crew",
  "model": "llama-3.3-70b-versatile",
  "topic": "Onboard new user {{user.email}} to Solace Hermes. Explain Chat, Crawl4AI, CrewAI, Links Hub, and Solace event mesh."
}
```

## Action 5 Optional — Notify owner

```json
{
  "action": "notify",
  "message": "New Clerk user {{user.email}} joined Solace Hermes",
  "user": {
    "id": "{{user.id}}",
    "email": "{{user.email}}"
  }
}
```

## Optional Notion record

Jika Notion sudah terkoneksi via Zapier, buat database item:

| Field | Value |
|---|---|
| Name | `{{user.first_name}} {{user.last_name}}` |
| Email | `{{user.email}}` |
| Clerk ID | `{{user.id}}` |
| Source | `Clerk / Zapier / Hermes` |
| Status | `New` |
| Created | `{{zap_meta_human_now}}` |

## Live helper pages

- Template UI: https://hermes-cloudflare.certveis.workers.dev/zapier
- Template JSON: https://hermes-cloudflare.certveis.workers.dev/zapier/template
- Integrations: https://hermes-cloudflare.certveis.workers.dev/integrations

## Security

- Simpan `<TOKEN>` di Zapier field private, jangan di public page.
- Worker provider keys tetap di Cloudflare Secrets.
- Setelah testing, rotasi token jika pernah terekspos.
