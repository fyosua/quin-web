import type { Metadata } from 'next'
import Link from 'next/link'
import ProjectImage from '@/components/public/ProjectImage'
import { about } from '@/content/about'
import { coverOf, getPublishedProjects } from '@/lib/projects'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'About',
  description: 'Quin is an interior architecture and design studio based in Kuala Lumpur.',
}

export default async function AboutPage() {
  const [first] = await getPublishedProjects()
  const cover = first ? coverOf(first) : null

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10 md:px-8 md:pt-14">
      <nav className="text-[10px] uppercase tracking-[0.18em] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2 text-muted/50">/</span>
        <span className="text-ink">About</span>
      </nav>

      <div className="mt-10 border-y border-line py-16 text-center md:py-20">
        <h1 className="page-title">The Studio</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm font-light leading-relaxed text-muted">
          {about.headline}
        </p>
      </div>

      <section className="grid gap-12 py-20 md:grid-cols-[0.8fr_1.2fr] md:gap-24">
        <div>
          <ProjectImage image={cover} ratio="4 / 5" sizes="(max-width: 768px) 100vw, 40vw" />
          {cover && (
            <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted">
              {first?.title}
              {first?.location ? ` · ${first.location}` : ''}
            </p>
          )}
        </div>
        <div className="max-w-[640px]">
          <p className="eyebrow">Profile</p>
          <p className="mt-6 font-heading text-2xl leading-snug md:text-[1.9rem]">{about.intro}</p>
          <div className="prose-serif mt-8">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/contact" className="btn">
              Start a project
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-12 border-t border-line py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-24">
        <h2 className="eyebrow">Services</h2>
        <ul className="grid gap-12 sm:grid-cols-2">
          {about.services.map((s) => (
            <li key={s.title}>
              <h3 className="font-heading text-2xl">{s.title}</h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-12 border-t border-line py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-24">
        <h2 className="eyebrow">Experience</h2>
        <ol className="space-y-10">
          {about.timeline.map((item) => (
            <li key={item.year} className="grid gap-2 sm:grid-cols-[180px_1fr]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{item.year}</span>
              <div>
                <h3 className="font-heading text-xl">{item.title}</h3>
                <p className="mt-1 text-sm font-light text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-12 border-t border-line py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-24">
        <h2 className="eyebrow">Clients</h2>
        <ul className="flex flex-wrap items-center gap-x-12 gap-y-6">
          {about.clients.map((client) => (
            <li key={client} className="font-heading text-xl text-muted">
              {client}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line pt-20 text-center">
        <h2 className="font-heading text-4xl md:text-5xl">Have a space in mind?</h2>
        <Link href="/contact" className="btn mt-10">
          Get in touch
        </Link>
      </section>
    </div>
  )
}