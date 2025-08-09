Captive Portal (MikroTik + FreeRADIUS + PostgreSQL)

Overview
- Local-only, production-ready captive portal with Sign Up / Sign In flows
- Auth backed by FreeRADIUS PostgreSQL (radcheck, radacct)
- MikroTik RouterOS API integration to add hotspot users and optionally permit client IP
- Self-hosted assets (Bootstrap, Chart.js) with no external CDNs

Project Structure
- server/: Node.js Express backend
- web/: Static frontend (served by Express)

Quick Start (Linux)
1) cd server && cp .env.example .env (or create .env; see sample below)
2) npm install
3) npm run start

Env vars
- PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD: FreeRADIUS PostgreSQL
- MT_HOST, MT_USER, MT_PASSWORD, MT_PORT, MT_TLS: MikroTik API settings
- ADMIN_USER, ADMIN_PASS: Admin panel credentials
- SESSION_SECRET: Session secret

FreeRADIUS DB Assumptions
- Existing tables: radcheck, radacct (as per default schema)
- App additionally creates portal_users for profile metadata

Deployment Notes
- Serve behind MikroTik hotspot captive portal redirect
- Ensure web server is reachable from walled garden
- No outbound internet required

### Linux deployment (public IP)

1) Layout paths
- Place this repo at `/opt/captive-portal` so that both `server/` and `web/` exist:
  - `/opt/captive-portal/server`
  - `/opt/captive-portal/web`

2) Configure environment
- `cd /opt/captive-portal/server`
- `cp .env.example .env`
- Edit `.env`:
  - `HOST=0.0.0.0`
  - `PORT=8080`
  - `TRUST_PROXY=true` if using a reverse proxy (Nginx)
  - `COOKIE_SECURE=auto` when HTTPS is terminated at the proxy
  - Set `PG*` variables to point at your FreeRADIUS PostgreSQL (set `PGSSL=true` if required)
  - Set `ADMIN_USER/ADMIN_PASS`
  - Set `MT_*` if you want MikroTik API integration

3) Install
- `cd /opt/captive-portal/server`
- `npm ci`

4) Optional: Reverse proxy (Nginx)
- Example server block (adjust domain/ports):

```
server {
  listen 80;
  server_name your.domain;  # or public IP
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

5) Run as a systemd service
- Copy `server/scripts/captive-portal.service` to `/etc/systemd/system/captive-portal.service`
- Create directories and permissions:
  - `sudo mkdir -p /opt/captive-portal`
  - `sudo chown -R www-data:www-data /opt/captive-portal` (or replace with your service user)
- Enable and start:
  - `sudo systemctl daemon-reload`
  - `sudo systemctl enable --now captive-portal`

6) Firewall
- Allow `8080/tcp` or your chosen port through your firewall (or expose only internally if using a reverse proxy)

7) MikroTik notes
- If `MT_TLS=true`, default API port is `8729`; otherwise `8728`
- Address-list ops are idempotent (avoid duplicates)

### Sample .env

```
# Web server
PORT=8080
HOST=0.0.0.0
TRUST_PROXY=true

# Session/Cookies
SESSION_SECRET=please-change-me
COOKIE_SAMESITE=lax
COOKIE_SECURE=auto
# SESSION_TTL_SECONDS=86400

# Static files
# PUBLIC_DIR=/opt/captive-portal/web

# Database
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=radius
PGUSER=radius
PGPASSWORD=radius
# PGSSL=true
# PGSSL_REJECT_UNAUTHORIZED=false

# Admin
ADMIN_USER=admin
ADMIN_PASS=changeme

# MikroTik (optional)
# MT_HOST=192.0.2.1
# MT_USER=apiuser
# MT_PASSWORD=apipass
# MT_TLS=true
# MT_PORT=8729
```


