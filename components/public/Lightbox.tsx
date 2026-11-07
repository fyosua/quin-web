'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import type { ProjectImage as ProjectImageModel } from '@prisma/client'

export default function Lightbox({ images }: { images: ProjectImageModel[] }) {
  const [index, setIndex] = useState<number | null>(null)
  const close = useCallback(() => setIndex(null), [])
  const step = useCallback(
    (dir: number) => setIndex((i) => (i === null ? null : (i + dir + images.length) % images.length)),
    [images.length],
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, close, step])

  return (
    <>
      {/* Uniform grid — keeps the gallery reading as a set of photographs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-surface"
            aria-label={`Open image ${i + 1} of ${images.length}: ${img.alt}`}
          >
            <Image
              src={img.fileKey}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
            />
          </button>
        ))}
      </div>

      {index !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-6 top-6 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-white"
          >
            Close (Esc)
          </button>
          <button
            type="button"
            onClick={() => step(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 px-4 py-8 text-2xl text-white/60 hover:text-white"
            aria-label="Previous image"
          >
            ←
          </button>
          <div className="relative max-h-[88vh] w-full max-w-5xl">
            <Image
              src={images[index].fileKey}
              alt={images[index].alt}
              width={images[index].width}
              height={images[index].height}
              sizes="90vw"
              className="mx-auto h-auto max-h-[88vh] w-auto object-contain"
              priority
            />
            <p className="mt-4 text-center text-[10px] tracking-[0.2em] text-white/50">
              {index + 1} / {images.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-8 text-2xl text-white/60 hover:text-white"
            aria-label="Next image"
          >
            →
          </button>
        </div>
      )}
    </>
  )
}