#!/usr/bin/env bash
set -euo pipefail

# Linux setup for captive portal service

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node 18+ first." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"
# Ensure .env exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp -n .env.example .env || true
  else
    cat > .env <<'EOF'
# Generated default .env
PORT=8080
HOST=0.0.0.0
TRUST_PROXY=true
SESSION_SECRET=please-change-me
COOKIE_SAMESITE=lax
COOKIE_SECURE=auto
# PUBLIC_DIR=
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=radius
PGUSER=radius
PGPASSWORD=radius
# PGSSL=false
# PGSSL_REJECT_UNAUTHORIZED=false
ADMIN_USER=admin
ADMIN_PASS=changeme
# MT_HOST=
# MT_USER=
# MT_PASSWORD=
# MT_TLS=true
# MT_PORT=8729
EOF
  fi
fi
npm ci
echo "Setup complete. Configure .env and run: npm start"


