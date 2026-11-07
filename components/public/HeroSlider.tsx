'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

export type HeroSlide = {
  id: string
  slug: string
  title: string
  category: string
  year: number | null
  location: string | null
  fileKey: string
  alt: string
}

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const count = slides.length

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count],
  )

  // Always auto-advance. Motion is still softened by the global prefers-reduced-motion rule,
  // which zeroes the transition rather than stopping the rotation.
  useEffect(() => {
    if (count <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000)
    return () => clearInterval(id)
  }, [count])

  if (count === 0) {
    return <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#3a342c,#0f0e0d_70%)]" />
  }


  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.fileKey}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.45),transparent_68%)]" />

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 border border-white/25 px-3 py-4 text-white/60 transition-colors hover:border-white hover:text-white md:block"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 border border-white/25 px-3 py-4 text-white/60 transition-colors hover:border-white hover:text-white md:block"
          >
            →
          </button>
        </>
      )}

    </div>
  )
}