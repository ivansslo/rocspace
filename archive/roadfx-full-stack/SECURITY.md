# 🔐 Security - ROADFX Full Stack

## Credential Management

### Cloudflare Secrets Required
- TOKEN, CLERK_PK, CLERK_SK
- GROQ_KEY, GEMINI_KEY, OR_KEY
- SOLACE_URL, SOLACE_USER, SOLACE_PASS
- CF_ACCOUNT_ID, CF_AI_TOKEN

### How to Set Secrets
```bash
wrangler secret put TOKEN --name roadfx-gateway
```

## Security Checklist
- [ ] All API keys as Cloudflare Secrets
- [ ] .env not committed to git
- [ ] Token rotation regularly
- [ ] No credentials in chat/screenshot/email
