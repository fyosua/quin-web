# Production server requirements

What you need to run this site for real — a single-box deployment, sized from measured
usage rather than guesswork.

## Recommended Linux

| | Choice | Why |
|---|---|---|
| **OS** | **Ubuntu 24.04 LTS** | 5-year support, PostgreSQL 16 and Node 22 packages are current, best documentation for Nginx/Certbot/fail2ban. This is what the PRD specifies for production. |
| Alternative | Debian 12 (bookworm) | Same base, slightly leaner; what staging actually runs on today. Choose it if you prefer fewer moving parts over Ubuntu's tooling. |
| Architecture | **x86-64 (amd64)** | Cheapest VPS pricing, every Node/native package ships prebuilt. ARM64 works (staging is a Raspberry Pi 5) but limits host choice. |
| Kernel | stock HWE kernel | No tuning needed for this workload. |

Avoid: Ubuntu 22.04 (PostgreSQL 16 needs the PGDG repo), CentOS/Alma (Node 22 and Certbot are
more work), any non-LTS release.

## Sizing

Measured on the current staging box (4-core ARM, 8 GB) with the real dataset:

| Component | Idle / steady state | Peak |
|---|---|---|
| Next.js server (`node`) | 45–90 MB RSS | — |
| PostgreSQL 16 | ~180 MB RSS | grows with dataset |
| `next build` (only during deploy) | — | **~900 MB RSS**, 25–90 s |
| Disk — app (`node_modules` 654 MB + `.next` 72 MB) | ~730 MB | +~200 MB during a build |
| Disk — uploads | ~0.5 MB per photo (3 WebP sizes) | grows with library |
| Disk — database | 8 MB for 6 projects | ~1–2 MB per 100 projects + messages |

### Minimum (works, little headroom)

| | |
|---|---|
| CPU | 2 vCPU |
| RAM | **2 GB + 2 GB swap** |
| Disk | 40 GB SSD |
| Bandwidth | 1 TB/month |
| Notes | The build is the memory spike — with 2 GB you need the swap, or build on CI and copy `.next`. Fine for < 50 projects and a few hundred photos. |

### Recommended (production)

| | |
|---|---|
| CPU | 2 vCPU (dedicated, not burst-only) |
| RAM | **4 GB** |
| Disk | 80 GB NVMe SSD |
| Bandwidth | 2 TB/month |
| Notes | Leaves ~3 GB free during deploys, room for PostgreSQL shared buffers, backups and logs. This matches the PRD's 2 vCPU / 4 GB / 60 GB floor with headroom. |

A 1 GB instance will run the site (steady state is ~300 MB) but **cannot build** without heavy
swapping — only use it if you build elsewhere and ship the `.next` directory.

### Storage growth

```
photos per project        up to 40
projects                  say 30
total photos              1,200
per photo (640+1280+1920) ~0.5 MB
                        → ~600 MB uploads
```

Add database, backups (7 daily + 4 weekly + 6 monthly dumps, compressed ≈ 50 MB total at this
size) and logs, and 80 GB lasts years. Filling the disk is the realistic failure mode on a photo
site — keep at least 20 % free and monitor it.

## Software on the box

| Package | Version | Purpose |
|---|---|---|
| Node.js | 22 LTS | runtime (`next start`) and the build |
| PostgreSQL | 16 | database |
| Nginx | 1.24+ | reverse proxy + TLS *if* you are not using a Cloudflare Tunnel |
| certbot | 2.x | Let's Encrypt certificates (Nginx path only) |
| cloudflared | latest | outbound-only tunnel (the path staging uses) |
| git, curl, ca-certificates | — | deploy |
| ufw, fail2ban, unattended-upgrades | — | hardening |

Build tools (gcc, make, python3) are **not** required — `sharp` and `@node-rs/argon2` ship
prebuilt binaries for linux-x64 and linux-arm64.

## Two valid network topologies

**A — Cloudflare Tunnel (no open ports, what staging uses)**

```
Internet → Cloudflare (TLS, WAF, optional Access) → cloudflared → 127.0.0.1:3020
```

- No inbound 80/443; the firewall can deny everything except SSH
- TLS, DDoS protection and caching handled at the edge
- Needs a domain on Cloudflare; `cloudflared` runs as a systemd service

**B — VPS with a public IP**

```
Internet → Nginx :443 (Let's Encrypt) → 127.0.0.1:3020 → Next.js
```

- `client_max_body_size 20m` (photo uploads), HTTP/2, HSTS, `www → apex` redirect
- Open 80/443, keep 3020 bound to loopback only
- fail2ban on the Nginx and sshd jails

Neither path needs a CDN to hit the performance targets — images are already served as
pre-generated WebP with immutable caching.

## OS-level settings worth changing

```bash
# swap (required on 2 GB, useful on 4 GB during builds)
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# timezone + NTP
timedatectl set-timezone Asia/Kuala_Lumpur

# PostgreSQL: modest box, keep it lean
# /etc/postgresql/16/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 8MB

# unattended security updates
dpkg-reconfigure --priority=low unattended-upgrades
```

## What this box does *not* need

- No Docker, no Kubernetes, no container registry — the deploy is `npm run build` + restart
- No Redis/Memcached — sessions and rate limits live in PostgreSQL
- No image CDN — `sharp` generates the variants at upload time
- No load balancer — a single Node process handles this traffic comfortably
  (`next start` is already multi-threaded for rendering; PostgreSQL handles concurrency)

## When to scale up

| Signal | Action |
|---|---|
| Builds start swapping / OOM | move to 4 GB, or build in CI and rsync `.next` |
| > 2,000 photos | consider object storage (Cloudflare R2) for `UPLOAD_DIR` |
| Sustained CPU > 70 % | add a second vCPU, or put Cloudflare cache rules in front of `/api/uploads` |
| Database > 5 GB | nightly logical backups become slow — move to `pg_basebackup` + WAL archiving |