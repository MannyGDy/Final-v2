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
1) cd server && cp .env.example .env (set DB and MikroTik parameters)
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


