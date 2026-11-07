-- Client-facing site must not carry the owner's personal name (freelance project).
ALTER TABLE "SiteSettings" ALTER COLUMN "contactName" SET DEFAULT '';
UPDATE "SiteSettings" SET "contactName" = '' WHERE "contactName" = 'Yosua Ferdian';