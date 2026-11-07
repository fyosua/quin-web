'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function SiteHeader({ hotline }: { hotline?: string }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg">
      {/* Utility strip — the benchmark keeps a thin contact row above the nav */}
      <div
        className={`hidden overflow-hidden border-b border-line transition-all duration-300 md:block ${
          scrolled ? 'h-0 border-transparent opacity-0' : 'h-9 opacity-100'
        }`}
      >
        <div className="mx-auto flex h-9 max-w-[1600px] items-center justify-between px-8 text-[10px] uppercase tracking-[0.2em] text-muted">
          <p className="flex items-center gap-3">
            <span className="text-ink">Quin Interior Design</span>
            <span className="h-3 w-px bg-line" />
            <span>Portfolio</span>
          </p>
          <p className="flex items-center gap-6">
            <a
              href={`tel:${(hotline ?? '+60 3 0000 0000').replace(/\s/g, '')}`}
              className="transition-colors hover:text-brass"
            >
              Hotline: {hotline ?? '+60 3 0000 0000'}
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 md:px-8">
        <Link
          href="/"
          className="font-heading text-[1.35rem] uppercase tracking-[0.42em] text-ink md:text-[1.55rem]"
          aria-label="Quin — home"
          onClick={() => setOpen(false)}
        >
          Quin
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              data-active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-end justify-center gap-[7px] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-px bg-ink transition-all ${open ? 'w-6 translate-y-[4px] rotate-45' : 'w-7'}`} />
          <span className={`h-px bg-ink transition-all ${open ? 'w-6 -translate-y-[4px] -rotate-45' : 'w-4'}`} />
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="h-[calc(100svh-5rem)] border-t border-line bg-bg md:hidden">
          <nav className="flex flex-col px-6 py-10" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-line py-6 font-heading text-3xl tracking-[0.06em]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${(hotline ?? '+60 3 0000 0000').replace(/\s/g, '')}`}
              className="mt-10 text-[11px] uppercase tracking-[0.2em] text-muted"
            >
              Hotline: {hotline ?? '+60 3 0000 0000'}
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}