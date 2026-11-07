import Link from 'next/link'
import ProjectForm from '@/components/admin/ProjectForm'
import { createProject } from '@/actions/projects'

export const dynamic = 'force-dynamic'

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl">
      <nav className="text-xs text-muted">
        <Link href="/management" className="hover:text-ink">
          Projects
        </Link>{' '}
        / New
      </nav>
      <h1 className="mt-3 font-heading text-4xl">New project</h1>
      <p className="mt-2 text-sm text-muted">
        Save as a draft first — images can be added after the project exists.
      </p>
      <div className="mt-10">
        <ProjectForm action={createProject} draftKey="new" />
      </div>
    </div>
  )
}