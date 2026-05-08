#!/usr/bin/env bash
# Run from project root on Linux/VPS. Applies migrations then seed (never skips migrate).
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> prisma generate"
npx prisma generate
echo "==> prisma migrate deploy"
npx prisma migrate deploy
echo "==> npm run seed"
npm run seed
echo "==> done"
