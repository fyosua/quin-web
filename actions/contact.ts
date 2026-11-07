'use server'

import { headers } from 'next/headers'
import { contactSchema } from '@/lib/validation'
import { prisma } from '@/lib/db'
import { clientIp } from '@/lib/ip'
import { hashIp, rateLimit } from '@/lib/rate-limit'

export type ContactState = {
  ok: boolean
  message: string
  errors?: Record<string, string[]>
}

async function verifyTurnstile(token: string | undefined, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET
  if (!secret) return true // not configured — honeypot + rate limit still apply
  if (!token) return false
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
    cache: 'no-store',
  })
  const json = (await res.json()) as { success?: boolean }
  return json.success === true
}

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const ip = await clientIp()

  const limit = await rateLimit(`contact:${ip ?? 'unknown'}`, 5, 60 * 60 * 1000)
  if (!limit.allowed) {
    return { ok: false, message: 'Too many messages from this connection. Please try again later.' }
  }

  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    subject: formData.get('subject'),
    message: formData.get('message'),
    website: formData.get('website'),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please check the highlighted fields.',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Honeypot filled → silently accept, never store.
  if (parsed.data.website) return { ok: true, message: 'Thank you — your message has been sent.' }

  const turnstileOk = await verifyTurnstile(
    formData.get('cf-turnstile-response')?.toString(),
    ip,
  )
  if (!turnstileOk) {
    return { ok: false, message: 'Spam check failed. Please reload and try again.' }
  }

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
      ipHash: hashIp(ip),
    },
  })

  await notifyOwner(parsed.data)

  return { ok: true, message: 'Thank you — your message has been sent. We reply within two working days.' }
}

async function notifyOwner(data: { name: string; email: string; phone?: string; subject: string; message: string }) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_NOTIFY_TO
  if (!key || !to) return

  try {
    const h = await headers()
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${h.get('host') ?? 'localhost'}`
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM ?? 'Quin <noreply@yosuaf.com>',
        to: [to],
        reply_to: data.email,
        subject: `[Quin] ${data.subject} — ${data.name}`,
        text: [
          `From: ${data.name} <${data.email}>`,
          data.phone ? `Phone: ${data.phone}` : null,
          `Subject: ${data.subject}`,
          '',
          data.message,
          '',
          `Sent from ${origin}`,
        ]
          .filter(Boolean)
          .join('\n'),
      }),
      cache: 'no-store',
    })
  } catch (err) {
    console.error('contact notification failed', err)
  }
}