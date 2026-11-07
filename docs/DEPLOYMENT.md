# Deployment

Both environments run **natively**: Node 22 + systemd + PostgreSQL 16. No Docker — a deploy is a
rebuild, not an image build.

```
Production  Internet → Nginx :443 (Let's Encrypt) → 127.0.0.1:3020 (Next.js) → PostgreSQL 16
Staging     Internet → Cloudflare (TLS) → cloudflared → 127.0.0.1:3020 (Next.js) → PostgreSQL 16
```

Production is a **VPS with a public IP** — see [Production (VPS)](#production-vps). Staging is the
home-lab box published through a tunnel; the sections below describe that shared setup first.

## Host layout (both environments)

| Piece | Path / unit |
|---|---|
| Application | `/home/deploy/quin-web` |
| Service | `quin-web.service` (`next start -p 3020 -H 127.0.0.1`) |
| Environment | `/home/deploy/quin-web/.env.production` (chmod 600) |
| Database | PostgreSQL 16, database `quin_staging`, role `quin` |
| Uploads | `/home/deploy/quin-web/uploads` |
| Tunnel | `/etc/cloudflared/config.yml` → `quin.yosuaf.com → http://127.0.0.1:3020` |
| Logs | `journalctl -u quin-web` |

## Prerequisites on the host

```bash
# Node 22 (official tarball, arm64 shown)
V=$(curl -s https://nodejs.org/dist/index.json | jq -r '[.[]|select(.version|startswith("v22"))][0].version')
curl -fsSLO "https://nodejs.org/dist/$V/node-$V-linux-arm64.tar.xz"
tar -xJf "node-$V-linux-arm64.tar.xz" -C /usr/local --strip-components=1 --overwrite

# PostgreSQL 16 (PGDG)
install -d /usr/share/postgresql-common/pgdg
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt-get update && apt-get install -y postgresql-16 postgresql-client-16
```

Database and role:

```bash
su postgres -c "psql -c \"CREATE ROLE quin LOGIN PASSWORD '<strong-password>';\" \
                     -c 'CREATE DATABASE quin_staging OWNER quin;'"
```

## Environment file

`/home/deploy/quin-web/.env.production`, mode `600`:

```dotenv
DATABASE_URL="postgresql://quin:<password>@127.0.0.1:5432/quin_staging?schema=public"
APP_ENV=staging
APP_VERSION=0.2.0
NEXT_PUBLIC_SITE_URL=https://quin.yosuaf.com
ROBOTS_NOINDEX=true                     # never index staging
SESSION_SECRET="<openssl rand -hex 32>"
UPLOAD_DIR=/home/deploy/quin-web/uploads
IP_HASH_SALT="<openssl rand -hex 16>"
REVALIDATE_TOKEN="<openssl rand -hex 24>"
TRUSTED_IP_HEADER=
TURNSTILE_SECRET=
RESEND_API_KEY=
CONTACT_NOTIFY_TO=
CONTACT_FROM=
```

Prisma reads `.env` by default, so CLI commands must load the file explicitly:

```bash
cd /home/deploy/quin-web && set -a && . ./.env.production && set +a && npx prisma migrate deploy
```

## systemd unit

`/etc/systemd/system/quin-web.service`:

```ini
[Unit]
Description=Quin portfolio (Next.js) — quin.yosuaf.com
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/quin-web
EnvironmentFile=/home/deploy/quin-web/.env.production
Environment=NODE_ENV=production
ExecStart=/usr/local/bin/node node_modules/next/dist/bin/next start -p 3020 -H 127.0.0.1
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now quin-web
systemctl status quin-web
journalctl -u quin-web -f
```

## Deploying a change

```bash
bash scripts/deploy-staging.sh
```

It syncs the source (excluding `node_modules`, `.next`, `uploads`, `.env*`), runs
`npm install` (a no-op when `package.json` is unchanged), `prisma migrate deploy`,
`npm run build`, restarts the service, waits for `/api/health`, then revalidates the public pages.

Measured on the staging Pi: **~100 s** cold, **~15 s** with a warm Next.js cache.

### Why the revalidate step matters

Pages are statically generated. The build runs without a database, so they are prerendered empty —
`POST /api/revalidate` repopulates them after every deploy and after seeding:

```bash
TOK=$(grep ^REVALIDATE_TOKEN= .env.production | cut -d= -f2 | tr -d '"')
curl -X POST http://127.0.0.1:3020/api/revalidate -H "x-revalidate-token: $TOK"
```

## Production (VPS)

The only differences from staging: a public IP, Nginx in front, Let's Encrypt for TLS, and the
firewall opened for 80/443.

### 1. Server hardening

```bash
adduser deploy && usermod -aG sudo deploy          # no root logins
# /etc/ssh/sshd_config: PasswordAuthentication no, PermitRootLogin no
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx git curl ufw fail2ban \
               unattended-upgrades postgresql-16 postgresql-client-16   # PGDG for PG16

ufw default deny incoming && ufw default allow outgoing
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw enable
```

2 GB swap if the box has 4 GB or less (the build spikes to ~900 MB).

### 2. DNS

| Record | Value |
|---|---|
| `A  @` | VPS IPv4 |
| `A  www` | VPS IPv4 |
| `AAAA` (optional) | VPS IPv6 |

Wait for propagation before requesting the certificate.

### 3. Application

Follow [Host layout](#host-layout), [Environment file](#environment-file) and
[systemd unit](#systemd-unit) below, with the app in `/home/deploy/quin-web`. In production:

```dotenv
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
ROBOTS_NOINDEX=false                  # production is indexable
TRUSTED_IP_HEADER=x-real-ip           # Nginx is the proxy in front
```

### 4. Nginx + TLS

```bash
sudo cp deploy/nginx/quin-web.conf /etc/nginx/sites-available/quin-web.conf
sudo sed -i 's/YOUR_DOMAIN/example.com/g' /etc/nginx/sites-available/quin-web.conf
sudo ln -s /etc/nginx/sites-available/quin-web.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d example.com -d www.example.com --redirect
sudo certbot renew --dry-run          # auto-renew via systemd timer
```

The config sets `www → apex`, `http → https`, HSTS, `client_max_body_size 20m`, and long-lived
caching for `/_next/static/` and `/api/uploads/`. It also rate-limits `/management/login` at the
edge.

### 5. Verify

```bash
curl -s https://example.com/api/health            # {"status":"ok","db":"ok",...}
curl -sI https://example.com | grep -i strict     # HSTS present
curl -sI http://example.com | head -1             # 301 → https
ss -tlnp | grep 3020                              # must be 127.0.0.1 only
```

Then run an SSL Labs check (target: A) and a Lighthouse pass on `/` and `/projects`.

### 6. Backups

```bash
# /etc/cron.d/quin-backup  — nightly at 02:00
0 2 * * * deploy pg_dump -Fc "$(grep ^DATABASE_URL /home/deploy/quin-web/.env.production | cut -d= -f2- | tr -d '\"')" \
  | gzip > /var/backups/quin/quin-$(date +\%F).dump.gz
```

Copy dumps and `uploads/` off the box with `rclone` to object storage. Test a restore monthly.

## Cloudflare Tunnel (staging only)


`/etc/cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/deploy/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: quin.yosuaf.com
    service: http://127.0.0.1:3020
  - service: http_status:404
```

```bash
cloudflared tunnel ingress validate
systemctl restart cloudflared
```

Because TLS terminates at Cloudflare and only localhost is published, the host needs no inbound
ports at all. Add the hostname to Cloudflare Zero Trust → Access if it should stay private.

## Database

```bash
# backup
pg_dump -Fc "$DATABASE_URL" > quin-$(date +%F).dump

# restore into a fresh database
createdb quin_restore && pg_restore --no-owner --no-privileges -d quin_restore quin-YYYY-MM-DD.dump
```

Uploads are ordinary files under `UPLOAD_DIR` — `rsync` them alongside the dump. A nightly cron
with `pg_dump` + `rclone` to object storage is the recommended next step (not yet configured).

## Rollback

The app is stateless; the database is not.

```bash
cd /home/deploy/quin-web
git log --oneline -5            # or: tar of the previous release
git checkout <previous-sha>
npm install && npm run build && systemctl restart quin-web
```

Migrations are forward-only — write them backwards-compatible (expand, then contract) so a code
rollback never needs a schema rollback.

## Health checks

```bash
curl -s http://127.0.0.1:3020/api/health
# {"status":"ok","db":"ok","version":"0.2.0","env":"staging",...}
```

`503` means the database is unreachable.

## Troubleshooting

| Symptom | Check |
|---|---|
| 502 from Cloudflare | `systemctl status quin-web`; is anything listening on `127.0.0.1:3020`? |
| Site loads but nothing is clickable | CSP in `middleware.ts` — see `docs/ARCHITECTURE.md` |
| Pages render empty after deploy | the revalidate call above did not run |
| Login loops back to the form | cookie `Secure` requires HTTPS; check `NEXT_PUBLIC_SITE_URL` |
| Uploads 404 | `UPLOAD_DIR` wrong, or the file was written by another user (check ownership) |