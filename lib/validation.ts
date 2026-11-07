import { z } from 'zod'

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes only.')

export const projectSchema = z.object({
  title: z.string().trim().min(2, 'Title is required.').max(140),
  slug: slugSchema,
  summary: z.string().trim().min(10, 'Summary needs at least 10 characters.').max(200),
  description: z.string().trim().min(20, 'Description needs at least 20 characters.'),
  category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'HOSPITALITY', 'OTHER']),
  location: z.string().trim().max(120).optional().or(z.literal('')),
  year: z.coerce.number().int().min(1900).max(2200).optional().or(z.literal('')),
  areaM2: z.coerce.number().int().min(0).max(1_000_000).optional().or(z.literal('')),
  client: z.string().trim().max(120).optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  featured: z.coerce.boolean().optional(),
})

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  subject: z.enum(['Project enquiry', 'Collaboration', 'Other']),
  message: z
    .string()
    .trim()
    .min(20, 'Please write at least 20 characters.')
    .max(2000, 'Please keep it under 2000 characters.'),
  website: z.string().max(0).optional().or(z.literal('')), // honeypot
})

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username.').max(64),
  accessId: z.string().min(1, 'Enter your Access ID.').max(200),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z.string().min(8, 'New password needs at least 8 characters.').max(128),
    confirmPassword: z.string().min(1, 'Confirm the new password.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export function emptyToNull(v: string | undefined | null) {
  return v && v.trim().length > 0 ? v.trim() : null
}