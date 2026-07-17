#!/bin/bash
set -e
echo "📤 Pushing updates to GitHub..."
cd "$HOME/ai-vitality"
git add .
git commit -m "feat: v3.0 Integrated Gateway + CLI tools

- gateway-integrated.js (Solace + Zapier + Models)
- CLI installer & runner (udocker)
- auto-deploy scripts
- .env with GitHub token
- API.md documentation
- Hardcore security + JWT

Owner: ivansslo
Domain: app.certveis.space" || true
git push origin main
echo "✅ Push successful!"
