# Quin — portfolio & studio admin

A portfolio website for an interior design studio: a dark, image-led public site plus a
single-admin dashboard for managing projects, photography and site copy — no code changes or
redeploys needed to publish work.

Built by [yosuaf.com](https://yosuaf.com) for a freelance client engagement.

**Staging:** https://quin.yosuaf.com

---

## What's inside

**Public site**

- Home: full-bleed hero that rotates through featured projects, with a continuously scrolling
  filmstrip of recent work beneath it
- Project index with category filters and load-more
- Project detail: cover, fact strip (location / year / area / client / category), Markdown body,
  photo grid with lightbox, related projects, and looping previous/next navigation
- About, and a text-only Contact page (email, phone, showroom, hours, socials)
- Per-page metadata, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, 404/500 pages

**Management area** (`/management`)

- Username + Access ID login (Argon2id, rate-limited, lockout after 5 failures)
- Project CRUD with Markdown editor and live preview, slug history (301s), drafts, publish,
  feature-on-slider, drag-to-reorder
- Image upload (drag & drop, multi-file, 15 MB each, up to 40 per project) processed to
  640/1280/1920 WebP variants, cover selection, alt text, reorder, delete
- Site content editor: studio statement, contact details, social links — saved straight to the
  live site
- Self-service password change that signs out every other session
- Audit log of every mutation

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, Server Actions), TypeScript |
| Styling | Tailwind CSS 4 with design tokens in `app/globals.css` |
| Data | PostgreSQL 16 + Prisma 6 |
| Auth | Argon2id (`@node-rs/argon2`) + opaque DB sessions, httpOnly cookie |
| Images | `sharp` → WebP variants served by `/api/uploads/[...path]` |
| Runtime | Node 22, systemd (no Docker) |

## Quick start

```bash
git clone https://github.com/fyosua/quin-web.git
cd quin-web
npm install
cp .env.example .env.local        # point DATABASE_URL at a local Postgres
npx prisma migrate deploy
npm run dev                       # http://localhost:3000
```

Optional sample content (6 projects, 23 photographs from Unsplash, processed locally):

```bash
set -a && . ./.env.local && set +a
npx tsx prisma/seed.ts            # add --force to replace existing projects
```

Create the first admin — the CLI prints a 24-character Access ID **once**:

```bash
npx tsx scripts/admin-create.ts --username owner
```

## Documentation

- **[docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md)** — day-to-day use, written for the client
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — server layout, deploy, backups, rollback
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — routes, data model, auth, image pipeline

## Project layout

```
app/
  (public)/            home, projects, project detail, about, contact
  management/          login + protected dashboard (projects, account)
  api/                 health, revalidate, uploads
actions/               server actions: projects, auth, account, contact, settings
components/
  public/              header, footer, hero slider, filmstrip, cards, lightbox
  admin/               login form, project form, image manager, tables, settings form
lib/                   db, auth, images, markdown, settings, validation, rate limits
prisma/                schema, migrations, seed
scripts/               admin CLI, staging deploy
content/               About page copy
```

## Environment

| Key | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (metadata, sitemap, OG images) |
| `ROBOTS_NOINDEX` | `true` on staging — noindex meta, empty sitemap, disallow-all robots |
| `UPLOAD_DIR` | Where WebP variants are written |
| `IP_HASH_SALT` | Salt for hashed visitor IPs on contact messages |
| `REVALIDATE_TOKEN` | Bearer token for `POST /api/revalidate` |
| `TRUSTED_IP_HEADER` | `cf-connecting-ip` / `x-real-ip` when behind a known proxy |
| `TURNSTILE_SECRET`, `RESEND_API_KEY`, `CONTACT_NOTIFY_TO` | Optional contact-form spam check and email |

## Security notes

- Sessions: 32-byte token, only the SHA-256 stored; cookie `httpOnly`, `Secure`,
  `SameSite=Strict`, `Path=/management`; 8 h idle / 24 h absolute expiry.
- Login: 5 attempts per username+IP per 15 minutes, plus a lockout on the account.
- Every admin server action re-checks the session — middleware is only a cheap redirect.
- Uploads are validated by magic bytes, re-encoded through sharp (strips EXIF), stored under
  random names and served as `image/webp` with `nosniff`.
- CSP is set in `middleware.ts`. It intentionally allows inline scripts from `'self'` because
  ISR pages bake their script tags into cached HTML, so a per-request nonce can never match and
  would block hydration. `/api/uploads` and `/_next/static` are excluded from the matcher.

## Photography

The sample content uses photographs from Unsplash (Unsplash License — free for commercial use).
Replace them with the studio's own photography before launch.

---

© 2026 Quin. All rights reserved. Website by [yosuaf.com](https://yosuaf.com).