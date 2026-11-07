'use server'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/guard'
import { hashSecret, passwordPolicyError, verifySecret } from '@/lib/auth/password'
import { destroyOtherSessions, getSessionUser } from '@/lib/auth/session'
import { changePasswordSchema } from '@/lib/validation'
import { clientIp } from '@/lib/ip'
import { rateLimit } from '@/lib/rate-limit'
import { writeAudit } from '@/lib/audit'

export type PasswordState = { ok?: boolean; message?: string; errors?: Record<string, string[]> }

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireAdmin()

  const limit = await rateLimit(`pwchange:${user.id}`, 5, 60 * 60 * 1000)
  if (!limit.allowed) return { message: 'Too many attempts. Try again later.' }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) {
    return { message: 'Please check the fields.', errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const policy = passwordPolicyError(parsed.data.newPassword, user.username)
  if (policy) return { message: policy, errors: { newPassword: [policy] } }

  const record = await prisma.adminUser.findUnique({ where: { id: user.id } })
  if (!record) return { message: 'Account not found.' }

  const valid = await verifySecret(record.accessIdHash, parsed.data.currentPassword)
  if (!valid) {
    const attempts = record.failedAttempts + 1
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedAttempts: attempts,
        lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    })
    await writeAudit({ userId: user.id, action: 'PASSWORD_CHANGE_FAILED', entity: 'AdminUser', entityId: user.id, ip: await clientIp() })
    return { message: 'Current password is incorrect.', errors: { currentPassword: ['Incorrect.'] } }
  }

  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return { message: 'New password must differ from the current one.' }
  }

  const hash = await hashSecret(parsed.data.newPassword)
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { accessIdHash: hash, failedAttempts: 0, lockedUntil: null, passwordChangedAt: new Date() },
  })

  const session = await getSessionUser()
  if (session) await destroyOtherSessions(user.id, session.sessionId)

  await writeAudit({ userId: user.id, action: 'PASSWORD_CHANGED', entity: 'AdminUser', entityId: user.id, ip: await clientIp() })

  return { ok: true, message: 'Password changed. Other sessions have been signed out.' }
}