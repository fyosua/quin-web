# Architecture

## Rendering model

| Route | Access | Rendering |
|---|---|---|
| `/` | public | ISR 300 s + on-demand `revalidatePath` |
| `/projects` | public | ISR 300 s |
| `/projects/[slug]` | public | `generateStaticParams` + ISR 300 s |
| `/about` | public | ISR 300 s |
| `/contact` | public | ISR (settings-driven) |
| `/management/login` | public, no-index | dynamic |
| `/management/*` | admin | dynamic, `no-store` |
| `/api/health` | public | dynamic |
| `/api/uploads/[...path]` | public | static WebP variants, immutable cache |
| `/api/revalidate` | token | dynamic |

Pages are built **without a database connection** (the build must not depend on live data), so
every read helper in `lib/projects.ts` and `lib/settings.ts` falls back to empty/defaults and
`/api/revalidate` is called after each deploy.

## Routes and files

```
app/(public)/layout.tsx          header + footer (footer reads SiteSettings)
app/(public)/page.tsx            hero slider + filmstrip + studio block + CTA
app/(public)/projects/page.tsx   index, ?category= and ?page= filters
app/(public)/projects/[slug]/    detail: cover, facts, markdown, gallery, related, prev/next
app/management/login/            credential form
app/management/(protected)/      session-gated layout: dashboard, project form, account
middleware.ts                    /management redirect + security headers/CSP
```

## Data model (Prisma, PostgreSQL 16)

| Model | Purpose |
|---|---|
| `Project` | slug (unique), title, summary (200), description (Markdown), category, location, year, area, client, `coverImageId`, status, featured, sortOrder, publishedAt, deletedAt |
| `ProjectImage` | fileKey (variant base), width/height, alt, sortOrder — cascade delete with the project |
| `SlugHistory` | old slug → project, used for 301 redirects |
| `AdminUser` | username, `accessIdHash` (Argon2id), failedAttempts, lockedUntil, lastLoginAt, passwordChangedAt |
| `Session` | SHA-256 of the opaque token, ip, userAgent, expiresAt, lastSeenAt |
| `SiteSettings` | singleton row: studio copy, contact details, social URLs |
| `ContactMessage` | name/email/phone/subject/message, hashed IP, status |
| `AuditLog` | who did what, to which entity, with JSON meta and IP |
| `RateLimit` | fixed-window counters (`key`, `count`, `expiresAt`) |

Ordering is `sortOrder ASC, publishedAt DESC` — the dashboard's drag-reorder rewrites `sortOrder`
in steps of 10.

## Authentication

1. `login` validates the form, applies a 5-per-15-min rate limit keyed by username+IP, then
   verifies Argon2id (m=19 MiB, t=2, p=1). Unknown usernames still burn a hash to keep timing flat.
2. On success a 32-byte token is generated; only its SHA-256 is stored in `Session`. The cookie is
   `httpOnly`, `Secure`, `SameSite=Strict`, `Path=/management` (8 h idle / 24 h absolute).
3. Middleware only checks that the cookie exists — every server action and the protected layout
   re-verify the session against the database.
4. Password change re-hashes, revokes every other session, keeps the current one and writes
   `PASSWORD_CHANGED` to the audit log.

## Image pipeline

```
upload (≤15 MB, magic-byte check)
  → sharp: auto-rotate, resize to 640 / 1280 / 1920, WebP q82
  → <UPLOAD_DIR>/<projectId>/<random>@<size>.webp
  → ProjectImage row (fileKey, width, height, alt, sortOrder)
```

`next/image` uses a custom loader (`lib/image-loader.ts`) that turns a `fileKey` into
`/api/uploads/<fileKey>?w=<width>`; the route picks the nearest pre-generated variant and serves it
with `image/webp`, `nosniff` and `immutable` caching. Path traversal is rejected both by string
check and by resolving the path inside `UPLOAD_DIR`.

## Publishing flow

```
save/publish/edit in dashboard
  → server action (session re-check, Zod validation, audit log)
  → revalidatePath('/', '/projects', '/projects/<slug>')
  → public ISR pages regenerate on next request
```

The edit page itself calls `router.refresh()` after image uploads and list actions so the admin
never sees stale rows.

## Design system

Tokens live in `app/globals.css` (`@theme`): near-black `#0f0e0d` ground, warm off-white
`#f3efe8` type, hairline `#2b2723`, brass accent `#c9a978`; Montserrat for UI, Cormorant Garamond
for display. Utility classes (`.btn`, `.field`, `.eyebrow`, `.page-title`, `.tile`, `.animate-marquee`)
keep components consistent.

## Security headers

Set in `middleware.ts` for every matched route: CSP, `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options: DENY`, `Permissions-Policy`, plus `X-Robots-Tag: noindex` and `no-store` under
`/management`.

**CSP note:** the policy allows inline scripts from `'self'` rather than a nonce. Prerendered/ISR
pages embed their script tags in cached HTML, so a per-request nonce can never match them — every
script would be blocked and the page would never hydrate (this exact failure was observed). If a
nonce is reintroduced later, it must be stable per build or the affected pages must render
dynamically.

## Known gaps

- No TOTP second factor (deliberately out of scope for v1).
- No contact-message inbox UI; messages are stored and optionally emailed.
- About page copy is a TypeScript module, not editable from the dashboard.
- Backups are manual (`pg_dump` + `rsync`); no scheduled offsite job yet.