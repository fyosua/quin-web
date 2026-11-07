# Admin guide

Everything on the public site can be changed from `/management` — no developer needed.

**Sign in:** https://quin.yosuaf.com/management/login — your username plus the long *Access ID*
you were given. Keep it in a password manager. You can change it yourself at **Account**.

---

## 1. The dashboard

`/management` lists every project — drafts included — with its category, status, photo count and
last update.

- **Search / filter** by title, slug, published or draft
- **Drag the ⠿ handle** to change the order projects appear in on the site
- **Publish / Unpublish** switches a project between public and hidden instantly
- **Delete** removes it from the site (soft delete — recoverable by the developer for 30 days)

A published change appears on the public site within a few seconds.

## 2. Adding a project

1. **New project** (top right)
2. Fill in **Title**, **Slug** (the URL part — lowercase, dashes only), **Summary** (max 200
   characters, used on cards and search results) and **Description**
3. **Description** is Markdown: `## Heading`, `**bold**`, `- bullet`, blank line for new
   paragraph. Use **Preview** to check it
4. Set **Category**, **Location**, **Year**, **Area**, **Client**
5. Tick **Feature on the home slider** to include it in the rotating hero
6. Leave **Status** as Draft while you work, switch to Published when ready
7. **Create project** → you land on the edit page where you add photos

Drafts of a new project are kept in the browser, so an accidental tab close does not lose typing.

## 3. Photographs

On the project edit page, the **Images** panel:

- **Upload** — drag files onto the dashed box or choose them. JPG, PNG, WebP or AVIF, max 15 MB
  each, up to 40 per project. Upload up to 6 at a time
- The **first image becomes the cover**; use **Set cover** on any other image to change it
- **Alt text** is required for accessibility — describe the photo ("Kitchen with stone island and
  oak cabinetry"). Click **Save** after editing
- **Drag images** to reorder the gallery
- **Delete** removes the image and its files

### Photo tips

- Landscape (3:2 or 4:3) works best for cards and the grid; portrait 4:5 for covers
- 2400 px on the long edge is plenty — the site generates 640/1280/1920 versions itself
- Choose the brightest, best-composed frame as the cover; it is also the social-share image

## 4. Site content

**Account → Site content** edits text used across the site:

| Field | Where it appears |
|---|---|
| Studio label + heading + paragraph | Home page "The studio" block |
| Direct contact name, email, phone | Contact page, footer |
| Showroom name, address, hours | Contact page, footer |
| Map link | Adds a "View on map →" link on the contact page (optional) |
| Instagram / LinkedIn / Facebook | Footer and contact page icons — leave blank to hide one |

Save with **Save site content**; the public pages refresh within seconds.

## 5. Account

**Account** shows your username and last sign-in, and lets you change the password.

- Minimum 8 characters, must differ from the username
- Changing it signs out every other browser and keeps you signed in here
- If you ever lose it, the developer can issue a new one from the server
  (`scripts/admin-rotate.ts`)

## 6. Common questions

**The image I uploaded is missing?** It appears immediately now; if it does not, reload the edit
page once. Large files (over 15 MB) are rejected — resize and retry.

**A project does not show on the site.** Check it is **Published** and not deleted. Drafts never
appear publicly, even with a direct link.

**I renamed a slug and old links broke?** They did not — old slugs redirect permanently to the new
one.

**Can I change the About page?** Not from the dashboard yet; that copy lives in the code
(`content/about.ts`). Ask the developer.

**Nothing loads / the page looks unstyled.** Hard-refresh once (`Ctrl/Cmd + Shift + R`); a deploy
may have replaced the cached assets.