import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateProject } from '@/actions/projects'
import ImageManager from '@/components/admin/ImageManager'
import ProjectForm from '@/components/admin/ProjectForm'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: { images: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!project) notFound()

  const publicHref = `/projects/${project.slug}`

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <nav className="text-xs text-muted">
          <Link href="/management" className="hover:text-ink">
            Projects
          </Link>{' '}
          / Edit
        </nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-heading text-4xl">{project.title}</h1>
          {project.status === 'PUBLISHED' && (
            <a href={publicHref} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-[0.14em] text-accent">
              View live ↗
            </a>
          )}
        </div>
      </div>

      <ProjectForm
        action={updateProject}
        draftKey={project.id}
        initial={{
          id: project.id,
          title: project.title,
          slug: project.slug,
          summary: project.summary,
          description: project.description,
          category: project.category,
          location: project.location ?? '',
          year: project.year?.toString() ?? '',
          areaM2: project.areaM2?.toString() ?? '',
          client: project.client ?? '',
          status: project.status,
          featured: project.featured,
        }}
      />

      <ImageManager
        projectId={project.id}
        coverImageId={project.coverImageId}
        images={project.images.map((i) => ({
          id: i.id,
          fileKey: i.fileKey,
          alt: i.alt,
          width: i.width,
          height: i.height,
          sortOrder: i.sortOrder,
        }))}
      />
    </div>
  )
}