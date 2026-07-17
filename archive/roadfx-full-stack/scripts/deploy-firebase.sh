#!/usr/bin/env bash
# =============================================================
# deploy-firebase.sh — Deploy ke Firebase Hosting
# Project: planning-with-ai-36675
# =============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
HOSTING_DIR="$PROJECT_DIR/firebase-hosting"

echo "🔥 Firebase Hosting Deploy"
echo "   Project: planning-with-ai-36675"
echo "   Dir: $HOSTING_DIR"
echo ""

# Check firebase CLI
if ! command -v firebase &>/dev/null; then
  echo "📦 Installing firebase-tools..."
  npm install -g firebase-tools
fi

# Check auth
if [ -n "${FIREBASE_TOKEN:-}" ]; then
  echo "✅ Using FIREBASE_TOKEN"
  cd "$HOSTING_DIR"
  firebase deploy --only hosting --token "$FIREBASE_TOKEN" --non-interactive
elif [ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
  echo "✅ Using service account: $GOOGLE_APPLICATION_CREDENTIALS"
  cd "$HOSTING_DIR"
  firebase deploy --only hosting --project planning-with-ai-36675 --non-interactive
else
  echo "⚠️  No auth found. Login first:"
  echo ""
  echo "   firebase login"
  echo "   cd firebase-hosting"
  echo "   firebase deploy --only hosting --project planning-with-ai-36675"
  echo ""
  echo "Or set FIREBASE_TOKEN:"
  echo "   export FIREBASE_TOKEN=\$(firebase login:ci)"
  echo ""
  exit 1
fi

echo ""
echo "🌐 Live at:"
echo "   https://planning-with-ai-36675.web.app"
echo "   https://planning-with-ai-36675.firebaseapp.com"
