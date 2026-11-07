-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "studioEyebrow" TEXT NOT NULL DEFAULT 'The studio',
    "studioHeading" TEXT NOT NULL DEFAULT 'Considered interiors,
built to be lived in.',
    "studioBody" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL DEFAULT 'hello@yosuaf.com',
    "contactPhone" TEXT NOT NULL DEFAULT '+60 3 0000 0000',
    "address" TEXT NOT NULL DEFAULT 'Kuala Lumpur, Malaysia',
    "hours" TEXT NOT NULL DEFAULT 'Visits by appointment',
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "pinterestUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);