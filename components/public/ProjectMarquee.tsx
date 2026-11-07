'use client'

import Image from 'next/image'
import Link from 'next/link'

export type MarqueeItem = {
  id: string
  slug: string
  title: string
  category: string
  fileKey: string
  alt: string
}

function Row({
  items,
  hidden,
  overlay,
}: {
  items: MarqueeItem[]
  hidden?: boolean
  overlay?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <Link
          key={`${hidden ? 'b-' : 'a-'}${item.id}`}
          href={`/projects/${item.slug}`}
          tabIndex={hidden ? -1 : undefined}
          className={`group/item relative block w-[190px] shrink-0 overflow-hidden transition-colors md:w-[230px] ${
            overlay ? 'bg-black/30 backdrop-blur-sm' : 'border border-line bg-bg'
          }`}
        >
          <div className="relative h-[104px] w-full md:h-[124px]">
            <Image
              src={item.fileKey}
              alt={item.alt}
              fill
              sizes="230px"
              className="object-cover opacity-90 transition-all duration-700 group-hover/item:scale-105 group-hover/item:opacity-100"
            />
          </div>
          <div className="flex items-baseline justify-between gap-3 px-2.5 py-2">
            <span
              className={`truncate font-heading text-[0.8rem] transition-colors group-hover/item:text-brass ${
                overlay ? 'text-white/90' : ''
              }`}
            >
              {item.title}
            </span>
            <span
              className={`shrink-0 text-[8px] uppercase tracking-[0.16em] ${
                overlay ? 'text-white/50' : 'text-muted'
              }`}
            >
              {item.category}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

/**
 * Continuous auto-scrolling strip (the benchmark's hero filmstrip, Magic-UI style).
 * Two identical tracks translate -50%, so the loop is seamless; hover pauses it and
 * `prefers-reduced-motion` stops it entirely.
 */
export default function ProjectMarquee({
  items,
  overlay = false,
}: {
  items: MarqueeItem[]
  overlay?: boolean
}) {
  if (items.length === 0) return null

  return (
    <div
      className={`group relative overflow-hidden ${
        overlay ? '' : 'border-b border-line bg-surface py-5'
      }`}
    >
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        <Row items={items} overlay={overlay} />
        <Row items={items} hidden overlay={overlay} />
      </div>

      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r to-transparent md:w-20 ${
          overlay ? 'from-black/60' : 'from-surface'
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l to-transparent md:w-20 ${
          overlay ? 'from-black/60' : 'from-surface'
        }`}
      />
    </div>
  )
}