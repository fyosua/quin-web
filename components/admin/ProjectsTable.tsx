'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { reorderProjects, setProjectStatus, softDeleteProject } from '@/actions/projects'

export type AdminRow = {
  id: string
  title: string
  slug: string
  category: string
  status: 'DRAFT' | 'PUBLISHED'
  featured: boolean
  updatedAt: string
  imageCount: number
}

export default function ProjectsTable({ rows: initial }: { rows: AdminRow[] }) {
  const [rows, setRows] = useState(initial)
  const [dragId, setDragId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const from = rows.findIndex((r) => r.id === dragId)
    const to = rows.findIndex((r) => r.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...rows]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setRows(next)
    setDragId(null)
    startTransition(async () => {
      await reorderProjects(next.map((r) => r.id))
    })
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-line bg-surface p-16 text-center">
        <p className="text-muted">No projects yet.</p>
        <Link href="/management/projects/new" className="btn mt-6">
          Add your first project
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface-2 text-[0.65rem] uppercase tracking-[0.14em] text-muted">
          <tr>
            <th className="w-8 px-3 py-3" aria-label="Reorder" />
            <th className="min-w-[220px] px-3 py-3">Project</th>
            <th className="whitespace-nowrap px-3 py-3">Category</th>
            <th className="whitespace-nowrap px-3 py-3">Status</th>
            <th className="whitespace-nowrap px-3 py-3">Images</th>
            <th className="whitespace-nowrap px-3 py-3">Updated</th>
            <th className="whitespace-nowrap px-3 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              draggable
              onDragStart={() => setDragId(row.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(row.id)}
              className={`border-b border-line last:border-0 ${dragId === row.id ? 'opacity-40' : ''}`}
            >
              <td className="cursor-grab px-3 py-3 text-muted" title="Drag to reorder">
                ⠿
              </td>
              <td className="px-3 py-3">
                <Link href={`/management/projects/${row.id}`} className="font-medium hover:text-accent">
                  {row.title}
                </Link>
                <div className="text-[0.7rem] text-muted">/{row.slug}</div>
              </td>
              <td className="px-3 py-3 text-muted">{row.category.toLowerCase()}</td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.1em] ${
                    row.status === 'PUBLISHED'
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-line bg-surface-2 text-muted'
                  }`}
                >
                  {row.status.toLowerCase()}
                  {row.featured ? ' · ★' : ''}
                </span>
              </td>
              <td className="px-3 py-3 text-muted">{row.imageCount}</td>
              <td className="px-3 py-3 text-muted">{new Date(row.updatedAt).toLocaleDateString()}</td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-3">
                  <form
                    action={async () => {
                      await setProjectStatus(row.id, row.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
                      router.refresh()
                    }}
                  >
                    <button type="submit" className="text-xs text-muted hover:text-ink" disabled={pending}>
                      {row.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>
                  </form>
                  <Link href={`/management/projects/${row.id}`} className="text-xs text-muted hover:text-ink">
                    Edit
                  </Link>
                  <form
                    action={async () => {
                      if (!confirm(`Delete “${row.title}”? It will be removed from the public site.`)) return
                      await softDeleteProject(row.id)
                      router.refresh()
                    }}
                  >
                    <button type="submit" className="text-xs text-red-700/80 hover:text-red-700">
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-3 py-2 text-[0.68rem] text-muted">
        Drag rows to change the order they appear on the public site.
      </p>
    </div>
  )
}