import type { Metadata } from 'next'
import Link from 'next/link'
import ProjectCard from '@/components/public/ProjectCard'
import { CATEGORIES, CATEGORY_LABEL, getPublishedProjects } from '@/lib/projects'
import type { Category } from '@prisma/client'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Residential, commercial and hospitality interiors by Quin.',
}

const PAGE_SIZE = 12

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params = await searchParams
  const raw = (params.category ?? 'ALL').toUpperCase()
  const category = CATEGORIES.includes(raw as (typeof CATEGORIES)[number]) ? raw : 'ALL'
  const page = Math.max(1, Number(params.page ?? '1') || 1)

  const all = await getPublishedProjects(category as Category | 'ALL')
  const visible = all.slice(0, page * PAGE_SIZE)
  const hasMore = all.length > visible.length

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10 md:px-8 md:pt-14">
      {/* Breadcrumb + centred title, mirroring the benchmark's Projects page */}
      <nav className="text-[10px] uppercase tracking-[0.18em] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2 text-muted/50">/</span>
        <span className="text-ink">Projects</span>
      </nav>

      <div className="mt-10 border-y border-line py-16 text-center md:py-24">
        <h1 className="page-title">Projects</h1>
        <p className="mx-auto mt-5 max-w-lg text-sm font-light text-muted">
          {category === 'ALL'
            ? 'The complete index of completed work.'
            : `${CATEGORY_LABEL[category as Category]} work.`}
        </p>
      </div>

      <nav className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3" aria-label="Filter by category">
        {CATEGORIES.map((c) => {
          const active = c === category
          const href = c === 'ALL' ? '/projects' : `/projects?category=${c}`
          return (
            <Link
              key={c}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`text-[11px] uppercase tracking-[0.18em] transition-colors ${
                active ? 'text-brass' : 'text-muted hover:text-ink'
              }`}
            >
              {c === 'ALL' ? 'All' : CATEGORY_LABEL[c as Category]}
            </Link>
          )
        })}
      </nav>

      {visible.length === 0 ? (
        <p className="py-32 text-center text-muted">No projects in this category yet.</p>
      ) : (
        <div className="mt-14 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} priority={i < 3} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-20 flex justify-center">
          <Link
            href={`/projects?${new URLSearchParams({
              ...(category !== 'ALL' ? { category: category as string } : {}),
              page: String(page + 1),
            }).toString()}`}
            className="btn btn-ghost"
          >
            Load more
          </Link>
        </div>
      )}

      <p className="mt-16 text-center text-[10px] uppercase tracking-[0.2em] text-muted">
        Showing {visible.length} of {all.length}
      </p>
    </div>
  )
}