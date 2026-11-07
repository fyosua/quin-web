import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/db'

export type SiteSettings = {
  studioEyebrow: string
  studioHeading: string
  studioBody: string
  contactName: string
  contactEmail: string
  contactPhone: string
  showroomName: string
  address: string
  hours: string
  mapUrl: string | null
  instagramUrl: string | null
  linkedinUrl: string | null
  facebookUrl: string | null
}

export const DEFAULT_SETTINGS: SiteSettings = {
  studioEyebrow: 'The studio',
  studioHeading: 'Considered interiors,\nbuilt to be lived in.',
  studioBody:
    'We take on a small number of projects at a time so that each one gets the attention it needs. Material honesty, natural light and an unhurried palette are the constants; everything else follows the brief and the building.',
  contactName: '',
  contactEmail: 'hello@yosuaf.com',
  contactPhone: '+60 3 0000 0000',
  showroomName: 'Quin Studio',
  address: 'Kuala Lumpur, Malaysia',
  hours: 'Visits by appointment',
  mapUrl: null,
  instagramUrl: 'https://www.instagram.com',
  linkedinUrl: 'https://www.linkedin.com',
  facebookUrl: 'https://www.facebook.com',
}

/**
 * Cached per request (React `cache`). Read-only: a missing row falls back to the
 * defaults so a visitor never triggers a write — the row is created by the first save
 * from /management/account.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
    if (!row) return DEFAULT_SETTINGS
    return {
      studioEyebrow: row.studioEyebrow,
      studioHeading: row.studioHeading,
      studioBody: row.studioBody,
      contactName: row.contactName,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      showroomName: row.showroomName,
      address: row.address,
      hours: row.hours,
      mapUrl: row.mapUrl,
      instagramUrl: row.instagramUrl,
      linkedinUrl: row.linkedinUrl,
      facebookUrl: row.facebookUrl,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
})