#!/bin/bash
set -e
echo "📤 Pushing updates to GitHub..."

# Dapatkan folder root repository secara otomatis berdasarkan lokasi script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

git add .
git commit -m "feat: added restricted groq models and updated sync configuration" || true
git push origin HEAD
echo "✅ Push successful!"
