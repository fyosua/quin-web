import 'server-only'
import { redirect } from 'next/navigation'
import { getSessionUser, type SessionUser } from '@/lib/auth/session'

/**
 * Every admin Server Action must call this — middleware alone is never trusted (PRD §7).
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/management/login')
  return user
}

export async function getAdminOrNull(): Promise<SessionUser | null> {
  return getSessionUser()
}