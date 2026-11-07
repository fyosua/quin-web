import Link from 'next/link'
import ProjectImage from '@/components/public/ProjectImage'
import { coverOf, CATEGORY_LABEL, type ProjectWithImages } from '@/lib/projects'

export default function ProjectCard({
  project,
  index = 0,
  priority = false,
}: {
  project: ProjectWithImages
  index?: number
  priority?: boolean
}) {
  const cover = coverOf(project)

  return (
    <article className="group">
      <Link href={`/projects/${project.slug}`} className="block">
        <div className="tile">
          <ProjectImage
            image={cover}
            ratio="4 / 3"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"
          />
        </div>
        <div className="mt-5 flex items-baseline justify-between gap-6 border-b border-line pb-4">
          <div>
            <h2 className="font-heading text-[1.45rem] leading-tight transition-colors group-hover:text-brass">
              {project.title}
            </h2>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
              {CATEGORY_LABEL[project.category]}
              {project.location ? ` · ${project.location}` : ''}
            </p>
          </div>
          <span className="shrink-0 text-[0.7rem] font-light tracking-[0.1em] text-muted">
            {project.year ?? ''}
          </span>
        </div>
      </Link>
    </article>
  )
}