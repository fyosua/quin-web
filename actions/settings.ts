'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/guard'
import { clientIp } from '@/lib/ip'
import { writeAudit } from '@/lib/audit'

const url = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\//.test(v), 'Must start with http:// or https://')

const schema = z.object({
  studioEyebrow: z.string().trim().min(1).max(60),
  studioHeading: z.string().trim().min(3).max(160),
  studioBody: z.string().trim().min(20).max(1200),
  contactName: z.string().trim().max(120),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().min(4).max(40),
  showroomName: z.string().trim().max(120),
  address: z.string().trim().min(3).max(240),
  hours: z.string().trim().max(120),
  mapUrl: url,
  instagramUrl: url,
  linkedinUrl: url,
  facebookUrl: url,
})

export type SettingsState = { ok?: boolean; message?: string; errors?: Record<string, string[]> }

export async function updateSiteSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireAdmin()

  const parsed = schema.safeParse({
    studioEyebrow: formData.get('studioEyebrow'),
    studioHeading: formData.get('studioHeading'),
    studioBody: formData.get('studioBody'),
    contactName: formData.get('contactName') ?? '',
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone'),
    showroomName: formData.get('showroomName') ?? '',
    address: formData.get('address'),
    hours: formData.get('hours') ?? '',
    mapUrl: formData.get('mapUrl'),
    instagramUrl: formData.get('instagramUrl'),
    linkedinUrl: formData.get('linkedinUrl'),
    facebookUrl: formData.get('facebookUrl'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please check the highlighted fields.',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: parsed.data,
    create: { id: 'singleton', ...parsed.data },
  })

  await writeAudit({
    userId: user.id,
    action: 'SETTINGS_UPDATE',
    entity: 'SiteSettings',
    entityId: 'singleton',
    ip: await clientIp(),
  })

  revalidatePath('/', 'layout')
  revalidatePath('/contact')

  return { ok: true, message: 'Saved — the public site has been updated.' }
}