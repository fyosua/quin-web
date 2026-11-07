'use client'

import Image from 'next/image'
import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteImage,
  reorderImages,
  setCoverImage,
  updateImage,
  uploadImages,
  type FormState,
} from '@/actions/projects'

export type AdminImage = {
  id: string
  fileKey: string
  alt: string
  width: number
  height: number
  sortOrder: number
}

export default function ImageManager({
  projectId,
  images: initialImages,
  coverImageId,
}: {
  projectId: string
  images: AdminImage[]
  coverImageId: string | null
}) {
  const [images, setImages] = useState(initialImages)
  const [coverId, setCoverId] = useState(coverImageId ?? initialImages[0]?.id ?? null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [isDraggingFile, setDraggingFile] = useState(false)
  const [, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = uploadImages.bind(null, projectId)
  const [state, formAction, pending] = useActionState(upload, {} as FormState)
  const router = useRouter()

  // Signature of the server-rendered list: when a refresh brings new rows in, adopt them.
  const signature = initialImages.map((i) => `${i.id}:${i.alt}:${i.sortOrder}`).join('|') + `|${coverImageId ?? ''}`

  useEffect(() => {
    setImages(initialImages)
    setCoverId(coverImageId ?? initialImages[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  // Re-fetch the edit page after an upload so the new images appear without a manual reload.
  useEffect(() => {
    if (state.ok) router.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const from = images.findIndex((i) => i.id === dragId)
    const to = images.findIndex((i) => i.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setImages(next)
    setDragId(null)
    startTransition(async () => {
      await reorderImages(projectId, next.map((i) => i.id))
    })
  }

  return (
    <section className="border border-line bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl">Images</h2>
          <p className="mt-1 text-xs text-muted">
            JPG, PNG, WebP or AVIF · max 15 MB each · {images.length}/40 · first image is the fallback cover
          </p>
        </div>
      </div>

      <form
        action={formAction}
        className={`mt-6 border border-dashed p-8 text-center transition-colors ${
          isDraggingFile ? 'border-accent bg-accent/5' : 'border-line bg-surface-2/60'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDraggingFile(true)
        }}
        onDragLeave={() => setDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDraggingFile(false)
          if (e.dataTransfer.files?.length && fileRef.current) {
            fileRef.current.files = e.dataTransfer.files
            fileRef.current.form?.requestSubmit()
          }
        }}
      >
        <input
          ref={fileRef}
          type="file"
          name="files"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="mx-auto block text-sm"
          required
        />
        <p className="mt-2 text-xs text-muted">Drag files here or choose them, then upload.</p>
        <button type="submit" className="btn btn-ghost mt-4" disabled={pending}>
          {pending ? 'Processing…' : 'Upload'}
        </button>
        {state.message && (
          <p className={`mt-3 text-sm ${state.ok ? 'text-accent' : 'text-red-700'}`}>{state.message}</p>
        )}
      </form>

      {images.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, index) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => setDragId(img.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(img.id)}
              className={`border border-line ${dragId === img.id ? 'opacity-40' : ''}`}
            >
              <div className="relative aspect-[4/3] bg-surface">
                <Image
                  src={img.fileKey}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
                {coverId === img.id && (
                  <span className="absolute left-2 top-2 bg-ink px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-white">
                    Cover
                  </span>
                )}
                <span className="absolute right-2 top-2 bg-bg/90 px-2 py-0.5 text-[0.6rem] text-muted">
                  {index + 1}
                </span>
              </div>

              <div className="space-y-2 p-3">
                <form
                  action={async (fd: FormData) => {
                    const alt = String(fd.get('alt') ?? '')
                    const res = await updateImage(projectId, img.id, alt)
                    if (res.ok) {
                      setImages((prev) => prev.map((p) => (p.id === img.id ? { ...p, alt } : p)))
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="alt"
                    defaultValue={img.alt}
                    aria-label="Alt text"
                    className="field flex-1 text-xs"
                    minLength={3}
                    required
                  />
                  <button type="submit" className="text-xs text-muted hover:text-ink">
                    Save
                  </button>
                </form>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className="text-muted hover:text-ink disabled:opacity-40"
                    disabled={coverId === img.id}
                    onClick={async () => {
                      setCoverId(img.id)
                      await setCoverImage(projectId, img.id)
                    }}
                  >
                    Set cover
                  </button>
                  <button
                    type="button"
                    className="text-red-700/80 hover:text-red-700"
                    onClick={async () => {
                      if (!confirm('Delete this image?')) return
                      await deleteImage(projectId, img.id)
                      setImages((prev) => prev.filter((p) => p.id !== img.id))
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-muted">No images yet. Upload at least one hero image.</p>
      )}

      {images.length > 1 && (
        <p className="mt-4 text-[0.68rem] text-muted">Drag images to reorder the gallery.</p>
      )}
    </section>
  )
}