import 'server-only'
import { prisma } from '@/lib/db'

export type AuditInput = {
  userId: string | null
  action: string
  entity: string
  entityId?: string | null
  meta?: Record<string, unknown>
  ip?: string | null
}

export async function writeAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        meta: (input.meta ?? undefined) as never,
        ip: input.ip ?? null,
      },
    })
  } catch (err) {
    console.error('audit write failed', err)
  }
}