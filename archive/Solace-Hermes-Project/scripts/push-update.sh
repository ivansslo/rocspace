#!/bin/bash
set -e
echo "📤 Pushing updates to GitHub..."

# Ensure we are in the project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Pre-push build check
echo "🛠️  Verifying build..."
npm run build

git add .
git commit -m "update: deployment and gateway refactor" || true

# Get the current branch name
BRANCH=$(git branch --show-current)
if [ -z "$BRANCH" ]; then
  BRANCH="master"
fi

echo "🚀 Pushing to branch: $BRANCH"
# Try to push, if it fails because of missing upstream, set it
git push origin "$BRANCH" || git push --set-upstream origin "$BRANCH"
echo "✅ Push successful!"
