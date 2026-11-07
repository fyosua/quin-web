import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import Lightbox from '@/components/public/Lightbox'
import ProjectImage from '@/components/public/ProjectImage'
import { renderMarkdown } from '@/lib/markdown'
import { prisma } from '@/lib/db'
import {
  CATEGORY_LABEL,
  coverOf,
  getAllPublishedSlugs,
  getProjectBySlug,
  getSiblingProjects,
} from '@/lib/projects'

export const revalidate = 300

type Params = { slug: string }

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs().catch(() => [])
  return slugs.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug).catch(() => null)
  if (!project) return { title: 'Project not found' }

  const cover = coverOf(project)
  const url = `/projects/${project.slug}`
  const ogImage = cover ? `/api/uploads/${cover.fileKey}?w=1280` : undefined

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: project.title,
      description: project.summary,
      url,
      images: ogImage ? [{ url: ogImage, width: 1280, height: 853, alt: cover?.alt }] : undefined,
    },
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    // Renamed slug → permanent redirect (PRD FR-D5).
    const old = await prisma.slugHistory.findUnique({ where: { oldSlug: slug } }).catch(() => null)
    if (old) {
      const current = await prisma.project.findUnique({
        where: { id: old.projectId },
        select: { slug: true, status: true, deletedAt: true },
      })
      if (current && current.status === 'PUBLISHED' && !current.deletedAt) {
        redirect(`/projects/${current.slug}`)
      }
    }
    notFound()
  }

  const cover = coverOf(project)
  const gallery = project.images.filter((img) => img.id !== cover?.id)
  const html = await renderMarkdown(project.description)
  const { prev, next, related } = await getSiblingProjects(project.slug, project.category)

  const facts = [
    project.location ? ['Location', project.location] : null,
    project.year ? ['Year', String(project.year)] : null,
    project.areaM2 ? ['Area', `${project.areaM2} m²`] : null,
    project.client ? ['Client', project.client] : null,
    ['Category', CATEGORY_LABEL[project.category]],
  ].filter((entry): entry is [string, string] => entry !== null)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary,
    dateCreated: project.year ? String(project.year) : undefined,
    locationCreated: project.location ?? undefined,
    creator: { '@type': 'Organization', name: 'Quin' },
    image: cover
      ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/uploads/${cover.fileKey}?w=1280`
      : undefined,
  }

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Full-bleed cover */}
      <div className="relative h-[64svh] min-h-[420px] w-full overflow-hidden bg-surface md:h-[82svh]">
        {cover ? (
          <ProjectImage
            image={cover}
            ratio="auto"
            priority
            sizes="100vw"
            alt={cover.alt}
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,#3a342c,#0f0e0d_70%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-[1600px] px-6 pb-10 md:px-8 md:pb-14">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">
            <Link href="/projects" className="hover:text-white">
              Projects
            </Link>
            <span className="mx-2">/</span>
            {CATEGORY_LABEL[project.category]}
          </p>
          <h1 className="mt-3 max-w-4xl font-heading text-4xl leading-tight text-white md:text-6xl">
            {project.title}
          </h1>
        </div>
      </div>

      <header className="mx-auto max-w-[1600px] px-6 pt-14 md:px-8 md:pt-20">
        <p className="max-w-3xl text-lg font-light leading-relaxed text-muted">{project.summary}</p>

        <dl className="mt-12 grid grid-cols-2 gap-y-8 border-y border-line py-8 md:grid-cols-5">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</dt>
              <dd className="mt-2 text-sm font-light">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
        <div className="prose-serif" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {gallery.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-6 pb-20 md:px-8">
          <div className="mb-8 flex items-center gap-4">
            <p className="eyebrow shrink-0">Gallery</p>
            <span className="h-px w-full bg-line" />
          </div>
          <Lightbox images={gallery} />
        </section>
      )}

      {(prev || next) && (
        <nav className="border-y border-line" aria-label="Project navigation">
          <div className="mx-auto grid max-w-[1600px] grid-cols-2 md:px-8">
            <div className="border-r border-line px-6 py-12 md:py-16">
              {prev && (
                <Link href={`/projects/${prev.slug}`} className="group block">
                  <span className="eyebrow">Previous</span>
                  <span className="mt-2 block font-heading text-xl transition-colors group-hover:text-brass md:text-2xl">
                    {prev.title}
                  </span>
                </Link>
              )}
            </div>
            <div className="px-6 py-12 text-right md:py-16">
              {next && (
                <Link href={`/projects/${next.slug}`} className="group block">
                  <span className="eyebrow">Next</span>
                  <span className="mt-2 block font-heading text-xl transition-colors group-hover:text-brass md:text-2xl">
                    {next.title}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}

      {related.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-6 py-20 md:px-8 md:py-28">
          <p className="eyebrow mb-8">Related projects</p>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/projects/${item.slug}`} className="group">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                  {item.cover && (
                    <Image
                      src={item.cover.fileKey}
                      alt={item.cover.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <p className="mt-4 font-heading text-xl transition-colors group-hover:text-brass">
                  {item.title}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  {CATEGORY_LABEL[item.category]}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}