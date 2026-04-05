#!/usr/bin/env bash
set -euo pipefail

PI_HOST="admin@bigpi"
REMOTE_DIR="/home/admin/proj/rogue"

echo "==> Checking SSH connection..."
ssh -o ConnectTimeout=5 "$PI_HOST" "echo 'Connected to Pi'" || {
  echo "ERROR: Cannot reach $PI_HOST"
  exit 1
}

echo "==> Pulling latest on Pi..."
ssh "$PI_HOST" "cd $REMOTE_DIR && git pull"

echo "==> Installing dependencies on Pi..."
ssh "$PI_HOST" "cd $REMOTE_DIR && npm ci --omit=dev 2>/dev/null || npm install"

echo "==> Building on Pi..."
ssh "$PI_HOST" "cd $REMOTE_DIR && npx tsc -p tsconfig.runtime.json && node scripts/build.js"

echo "==> Reloading PM2 (production mode)..."
ssh "$PI_HOST" "cd $REMOTE_DIR && NODE_ENV=production pm2 reload rogue-app && pm2 reload rogue-tunnel"

echo "==> Waiting for startup..."
sleep 2

echo "==> Checking health..."
ssh "$PI_HOST" "curl -sf http://localhost:4173/ | head -3 && echo '...OK'"

echo ""
echo "==> Deploy complete!"
echo "    Public: https://rogue.andrewvpopov.com"
