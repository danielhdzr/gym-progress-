#!/usr/bin/env bash
# Compila la app y publica dist/ en la rama gh-pages del repo (GitHub Pages).
set -euo pipefail

cd "$(dirname "$0")/.."
REMOTE_URL=$(git remote get-url origin)

npm test
npm run build
touch dist/.nojekyll

cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -f "$REMOTE_URL" gh-pages
rm -rf .git

echo "✅ Publicado. GitHub Pages tarda ~1 minuto en actualizarse."
