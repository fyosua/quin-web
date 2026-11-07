-- Social links: Facebook replaces Pinterest
ALTER TABLE "SiteSettings" RENAME COLUMN "pinterestUrl" TO "facebookUrl";
UPDATE "SiteSettings" SET "facebookUrl" = 'https://www.facebook.com' WHERE "facebookUrl" LIKE '%pinterest%';
