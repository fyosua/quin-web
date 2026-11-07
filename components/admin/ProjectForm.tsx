'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { FormState } from '@/actions/projects'

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial?: {
    id?: string
    title: string
    slug: string
    summary: string
    description: string
    category: string
    location: string
    year: string
    areaM2: string
    client: string
    status: 'DRAFT' | 'PUBLISHED'
    featured: boolean
  }
  draftKey: string
}

const empty = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  category: 'RESIDENTIAL',
  location: '',
  year: '',
  areaM2: '',
  client: '',
  status: 'DRAFT' as const,
  featured: false,
}

export default function ProjectForm({ action, initial, draftKey }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as FormState)
  const data = initial ?? empty
  const [values, setValues] = useState(data)
  const [preview, setPreview] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const isNew = !initial?.id
  const storageKey = `quin:draft:${draftKey}`

  // Local autosave every 10s (PRD FR-B8).
  useEffect(() => {
    if (!isNew) return
    const id = setInterval(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values))
        setSavedAt(new Date().toLocaleTimeString())
      } catch {
        /* storage full */
      }
    }, 10_000)
    return () => clearInterval(id)
  }, [values, storageKey, isNew])

  // Restore a draft for new projects only.
  useEffect(() => {
    if (!isNew) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.title || parsed?.description) setValues((v) => ({ ...v, ...parsed }))
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, isNew])

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const previewHtml =
    typeof window === 'undefined'
      ? ''
      : DOMPurify.sanitize(marked.parse(values.description || '_Nothing yet._', { async: false }) as string)

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="label">
            Title *
          </label>
          <input
            id="title"
            name="title"
            required
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            className="field"
          />
          {state.errors?.title && <p className="mt-1 text-xs text-red-700">{state.errors.title[0]}</p>}
        </div>

        <div>
          <label htmlFor="slug" className="label">
            Slug *
          </label>
          <input
            id="slug"
            name="slug"
            required
            value={values.slug}
            onChange={(e) => update('slug', e.target.value)}
            className="field font-mono text-sm"
            placeholder="auto-generated from the title"
          />
          {state.errors?.slug && <p className="mt-1 text-xs text-red-700">{state.errors.slug[0]}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="summary" className="label">
          Summary * <span className="normal-case tracking-normal">(max 200 characters)</span>
        </label>
        <input
          id="summary"
          name="summary"
          maxLength={200}
          required
          value={values.summary}
          onChange={(e) => update('summary', e.target.value)}
          className="field"
        />
        <p className="mt-1 text-right text-[0.7rem] text-muted">{values.summary.length}/200</p>
        {state.errors?.summary && <p className="mt-1 text-xs text-red-700">{state.errors.summary[0]}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="label mb-0">Description * <span className="normal-case tracking-normal">(Markdown)</span></span>
          <button type="button" onClick={() => setPreview((v) => !v)} className="text-xs text-muted underline">
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
        <textarea
          id="description"
          name="description"
          rows={14}
          required
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          className={`field mt-2 font-mono text-[0.85rem] ${preview ? 'hidden' : ''}`}
        />
        {preview && (
          <div
            className="prose-serif mt-2 min-h-[280px] border border-line bg-surface p-6"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
        {state.errors?.description && (
          <p className="mt-1 text-xs text-red-700">{state.errors.description[0]}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="category" className="label">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={values.category}
            onChange={(e) => update('category', e.target.value)}
            className="field"
          >
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="HOSPITALITY">Hospitality</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="location" className="label">
            Location
          </label>
          <input
            id="location"
            name="location"
            value={values.location}
            onChange={(e) => update('location', e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="year" className="label">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            min={1900}
            max={2200}
            value={values.year}
            onChange={(e) => update('year', e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="areaM2" className="label">
            Area (m²)
          </label>
          <input
            id="areaM2"
            name="areaM2"
            type="number"
            min={0}
            value={values.areaM2}
            onChange={(e) => update('areaM2', e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="client" className="label">
            Client
          </label>
          <input
            id="client"
            name="client"
            value={values.client}
            onChange={(e) => update('client', e.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={(e) => update('status', e.target.value as 'DRAFT' | 'PUBLISHED')}
            className="field"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="featured"
          checked={values.featured}
          onChange={(e) => update('featured', e.target.checked)}
          className="h-4 w-4 accent-[#a88b5e]"
        />
        Feature on the home slider
      </label>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Saving…' : initial?.id ? 'Save changes' : 'Create project'}
        </button>
        {state.message && (
          <p className={`text-sm ${state.ok ? 'text-accent' : 'text-red-700'}`}>{state.message}</p>
        )}
        {savedAt && isNew && <p className="text-xs text-muted">Local draft saved at {savedAt}</p>}
      </div>
    </form>
  )
}