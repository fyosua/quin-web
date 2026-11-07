import 'server-only'
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/db'

/** Fixed-window counter backed by Postgres so it survives restarts and works per container. */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + windowMs)

  const existing = await prisma.rateLimit.findUnique({ where: { key } })
  if (!existing || existing.expiresAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: 1, expiresAt },
    })
    return { allowed: true, remaining: limit - 1 }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.expiresAt.getTime() - now.getTime() }
  }

  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
  return { allowed: true, remaining: limit - existing.count - 1 }
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.IP_HASH_SALT ?? 'quin-web'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}