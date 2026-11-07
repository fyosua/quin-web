import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Post-seed / post-migration cache refresh. The image is built without a database,
 * so public pages start empty until this is called once.
 *
 *   curl -X POST https://<host>/api/revalidate -H "x-revalidate-token: $TOKEN"
 */
export async function POST(request: Request) {
  const token = process.env.REVALIDATE_TOKEN
  if (!token || request.headers.get('x-revalidate-token') !== token) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  revalidatePath('/', 'layout')
  revalidatePath('/projects')
  revalidatePath('/about')

  const slugs = await prisma.project
    .findMany({ where: { status: 'PUBLISHED', deletedAt: null }, select: { slug: true } })
    .catch(() => [])

  for (const { slug } of slugs) revalidatePath(`/projects/${slug}`)

  return NextResponse.json({ ok: true, revalidated: slugs.length + 3 })
}