import 'server-only'
import { cookies } from 'next/headers'
import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/db'

export const SESSION_COOKIE = 'q_session'
const IDLE_MS = 8 * 60 * 60 * 1000
const ABSOLUTE_MS = 24 * 60 * 60 * 1000
const TOUCH_AFTER_MS = 5 * 60 * 1000

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export type SessionUser = { id: string; username: string; sessionId: string }

export async function createSession(userId: string, ip: string | null, userAgent: string | null) {
  const token = randomBytes(32).toString('base64url')
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + ABSOLUTE_MS),
      lastSeenAt: new Date(),
    },
  })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/management',
    maxAge: Math.floor(ABSOLUTE_MS / 1000),
  })
  return session
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, username: true } } },
  })
  if (!session) return null

  const now = Date.now()
  const idleDeadline = session.lastSeenAt.getTime() + IDLE_MS
  if (session.expiresAt.getTime() < now || idleDeadline < now) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }

  if (now - session.lastSeenAt.getTime() > TOUCH_AFTER_MS) {
    await prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => {})
  }

  return { id: session.user.id, username: session.user.username, sessionId: session.id }
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  }
  jar.set(SESSION_COOKIE, '', { path: '/management', maxAge: 0 })
}

export async function destroyOtherSessions(userId: string, keepSessionId: string) {
  await prisma.session.deleteMany({
    where: { userId, id: { not: keepSessionId } },
  })
}