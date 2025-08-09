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
cp -n .env.example .env || true
npm ci
echo "Setup complete. Configure .env and run: npm start"


