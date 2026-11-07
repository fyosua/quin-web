'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { burnTime, verifySecret } from '@/lib/auth/password'
import { createSession, destroySession, getSessionUser } from '@/lib/auth/session'
import { clientIp } from '@/lib/ip'
import { rateLimit } from '@/lib/rate-limit'
import { writeAudit } from '@/lib/audit'
import { loginSchema } from '@/lib/validation'

export type LoginState = { error?: string }

const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    accessId: formData.get('accessId'),
  })
  if (!parsed.success) return { error: 'Invalid credentials.' }

  const { username, accessId } = parsed.data
  const ip = await clientIp()

  // 5 attempts per username+IP per 15 minutes (PRD §7).
  const limit = await rateLimit(`login:${username.toLowerCase()}:${ip ?? 'unknown'}`, MAX_ATTEMPTS, LOCK_MS)
  if (!limit.allowed) return { error: 'Too many attempts. Try again in a few minutes.' }

  const user = await prisma.adminUser.findUnique({ where: { username } })

  if (!user) {
    await burnTime(accessId)
    return { error: 'Invalid credentials.' }
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: 'Invalid credentials.' }
  }

  const valid = await verifySecret(user.accessIdHash, accessId)
  if (!valid) {
    const attempts = user.failedAttempts + 1
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedAttempts: attempts,
        lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MS) : null,
      },
    })
    await writeAudit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entity: 'AdminUser',
      entityId: user.id,
      ip,
      meta: { attempts },
    })
    return { error: 'Invalid credentials.' }
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  })
  await createSession(user.id, ip, formData.get('userAgent')?.toString().slice(0, 300) ?? null)
  await writeAudit({ userId: user.id, action: 'LOGIN', entity: 'AdminUser', entityId: user.id, ip })

  redirect('/management')
}

export async function logout() {
  const user = await getSessionUser()
  if (user) {
    await writeAudit({ userId: user.id, action: 'LOGOUT', entity: 'AdminUser', entityId: user.id })
  }
  await destroySession()
  redirect('/management/login')
}