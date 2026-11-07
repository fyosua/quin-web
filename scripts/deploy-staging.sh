#!/usr/bin/env bash
# Staging deploy for quin.yosuaf.com — native Node + systemd + PostgreSQL 16.
# No Docker: an update is sync → npm install (cached) → migrate → build → restart.
set -euo pipefail

HOST="${HOST:?set HOST, e.g. root@your-server}"
REMOTE_DIR="${REMOTE_DIR:-/home/deploy/quin-web}"
SERVICE="${SERVICE:-quin-web}"
SITE="${SITE:-https://quin.yosuaf.com}"

echo "==> syncing source to ${HOST}:${REMOTE_DIR}"
tar -czf - \
  --exclude=node_modules --exclude=.next --exclude=uploads \
  --exclude='*.md' --exclude=.git --exclude='.env*' . |
  ssh "$HOST" "mkdir -p ${REMOTE_DIR} && tar -xzf - -C ${REMOTE_DIR}"

echo "==> installing dependencies (no-op when package.json is unchanged)"
ssh "$HOST" "cd ${REMOTE_DIR} && npm install --no-audit --no-fund --prefer-offline"

echo "==> applying migrations"
ssh "$HOST" "cd ${REMOTE_DIR} && set -a && . ./.env.production && set +a && npx prisma migrate deploy"

echo "==> building"
ssh "$HOST" "cd ${REMOTE_DIR} && npm run build"

echo "==> restarting ${SERVICE}"
ssh "$HOST" "systemctl restart ${SERVICE}"

echo "==> waiting for health"
for i in $(seq 1 30); do
  if ssh "$HOST" "curl -fsS http://127.0.0.1:3020/api/health >/dev/null 2>&1"; then
    echo "healthy after ${i}s"
    break
  fi
  sleep 2
done

ssh "$HOST" "curl -fsS http://127.0.0.1:3020/api/health" && echo

echo "==> revalidating public pages"
ssh "$HOST" "cd ${REMOTE_DIR} && TOK=\$(grep REVALIDATE_TOKEN .env.production | cut -d= -f2) && curl -fsS -X POST http://127.0.0.1:3020/api/revalidate -H \"x-revalidate-token: \$TOK\"" && echo

echo "==> done: ${SITE}"