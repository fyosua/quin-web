import Link from 'next/link'
import ProjectsTable, { type AdminRow } from '@/components/admin/ProjectsTable'
import { prisma } from '@/lib/db'
import { CATEGORY_LABEL } from '@/lib/projects'
import type { Category, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...(status === 'DRAFT' || status === 'PUBLISHED' ? { status } : {}),
    ...(q
      ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] }
      : {}),
  }

  const [projects, counts] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      include: { _count: { select: { images: true } } },
    }),
    prisma.project.groupBy({ by: ['status'], where: { deletedAt: null }, _count: true }),
  ])

  const rows: AdminRow[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: CATEGORY_LABEL[p.category as Category],
    status: p.status,
    featured: p.featured,
    updatedAt: p.updatedAt.toISOString(),
    imageCount: p._count.images,
  }))

  const total = counts.reduce((sum, c) => sum + c._count, 0)
  const published = counts.find((c) => c.status === 'PUBLISHED')?._count ?? 0

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 font-heading text-4xl">Projects</h1>
          <p className="mt-2 text-sm text-muted">
            {total} total · {published} published · {total - published} draft
          </p>
        </div>
        <Link href="/management/projects/new" className="btn">
          New project
        </Link>
      </header>

      <form className="mt-8 flex flex-wrap items-center gap-3" action="/management">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search title or slug"
          className="field max-w-xs"
          aria-label="Search projects"
        />
        <select name="status" defaultValue={status ?? ''} className="field max-w-[180px]" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        <button type="submit" className="btn btn-ghost">
          Filter
        </button>
        {(q || status) && (
          <Link href="/management" className="text-xs text-muted underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6">
        <ProjectsTable rows={rows} />
      </div>
    </div>
  )
}