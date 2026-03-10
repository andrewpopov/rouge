#!/usr/bin/env bash
set -euo pipefail

PI_HOST="admin@bigpi"
REMOTE_DIR="/home/admin/proj/rouge"
SKIP_BUILD=false

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
  esac
done

echo "==> Checking SSH connection..."
ssh -o ConnectTimeout=5 "$PI_HOST" "echo 'Connected to Pi'" || {
  echo "ERROR: Cannot reach $PI_HOST"
  exit 1
}

if [ "$SKIP_BUILD" = false ]; then
  echo "==> Building locally..."
  npm run build
fi

echo "==> Syncing to Pi..."
ssh "$PI_HOST" "mkdir -p $REMOTE_DIR/logs"

rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='generated/tests' \
  --exclude='tests' \
  --exclude='artifacts' \
  --exclude='assets/diablo2_downloads' \
  --exclude='logs' \
  ./ "$PI_HOST:$REMOTE_DIR/"

echo "==> Starting PM2 processes..."
ssh "$PI_HOST" "cd $REMOTE_DIR && pm2 startOrReload ecosystem.config.js --update-env"

echo "==> Waiting for startup..."
sleep 3

echo "==> Checking status..."
ssh "$PI_HOST" "pm2 list | grep rouge"

echo ""
echo "==> Checking health..."
ssh "$PI_HOST" "curl -sf http://localhost:4173/ | head -3 && echo '...OK'"

echo ""
echo "==> Deploy complete!"
echo "    Local:  http://localhost:4173"
echo "    Public: https://rouge.andrewvpopov.com"
