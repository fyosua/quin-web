import Link from 'next/link'
import HeroSlider, { type HeroSlide } from '@/components/public/HeroSlider'
import ProjectMarquee, { type MarqueeItem } from '@/components/public/ProjectMarquee'
import ProjectCard from '@/components/public/ProjectCard'
import { CATEGORY_LABEL, coverOf, getFeaturedProjects, getPublishedProjects } from '@/lib/projects'
import { getSettings } from '@/lib/settings'

export const revalidate = 300

export default async function HomePage() {
  const [featured, projects, settings] = await Promise.all([
    getFeaturedProjects(5),
    getPublishedProjects(),
    getSettings(),
  ])

  const sliderSource = featured.length > 0 ? featured : projects.slice(0, 3)
  const slides: HeroSlide[] = sliderSource
    .map((project) => {
      const cover = coverOf(project)
      if (!cover) return null
      return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: CATEGORY_LABEL[project.category],
        year: project.year,
        location: project.location,
        fileKey: cover.fileKey,
        alt: cover.alt,
      }
    })
    .filter((s): s is HeroSlide => s !== null)

  const marqueeItems: MarqueeItem[] = (projects.length > 0 ? projects : sliderSource)
    .map((project) => {
      const cover = coverOf(project)
      if (!cover) return null
      return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        category: CATEGORY_LABEL[project.category],
        fileKey: cover.fileKey,
        alt: cover.alt,
      }
    })
    .filter((item): item is MarqueeItem => item !== null)

  const headingLines = settings.studioHeading.split('\n').filter(Boolean)

  return (
    <>
      {/* Hero — auto-advancing slider of featured projects, benchmark layout */}
      <section className="relative flex h-[calc(100svh-5rem)] items-center justify-center overflow-hidden md:h-[calc(100svh-7.25rem)]">
        <HeroSlider slides={slides} />

        <div className="pointer-events-none relative z-10 -translate-y-6 px-6 text-center md:-translate-y-16">
          <p className="text-[9px] uppercase tracking-[0.24em] text-white/65 md:text-[10px] md:tracking-[0.32em]">
            Interior Architecture &amp; Design — Est. 2015
          </p>
          <h1 className="mt-6 font-heading text-[3.2rem] uppercase leading-[1.05] tracking-[0.16em] text-white md:text-[5.5rem] md:tracking-[0.2em]">
            Quin
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed text-white/75 md:text-base">
            Residences, restaurants and workplaces designed around light, material and the way
            people actually live.
          </p>
          <div className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/projects" className="btn">
              View projects
            </Link>
            <Link
              href="/contact"
              className="btn border-white/60 bg-black/25 text-white backdrop-blur-sm hover:border-brass hover:bg-black/40 hover:text-brass"
            >
              Book an appointment
            </Link>
          </div>
        </div>

        {/* Auto-scrolling filmstrip, pinned to the bottom of the hero (benchmark layout) */}
        <div className="absolute inset-x-0 bottom-0 z-20 hidden pb-4 md:block">
          <ProjectMarquee items={marqueeItems} overlay />
        </div>
      </section>

      {/* Selected work */}
      <section className="mx-auto max-w-[1600px] px-6 py-24 md:px-8 md:py-32">
        <div className="flex flex-col gap-6 text-center">
          <p className="eyebrow">Selected work</p>
          <h2 className="page-title">Projects</h2>
          <p className="mx-auto max-w-xl text-sm font-light leading-relaxed text-muted">
            A selection of completed interiors across Malaysia, Singapore and Vietnam.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted">No published projects yet.</p>
            <Link href="/management/login" className="nav-link mt-6 inline-block">
              Sign in to add the first one
            </Link>
          </div>
        ) : (
          <div className="mt-16 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} priority={i < 3} />
            ))}
          </div>
        )}

        <div className="mt-16 flex justify-center">
          <Link href="/projects" className="btn btn-ghost">
            All projects
          </Link>
        </div>
      </section>

      {/* Studio statement — copy is editable at /management/account */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-6 py-24 md:grid-cols-2 md:gap-20 md:px-8 md:py-32">
          <div>
            <p className="eyebrow">{settings.studioEyebrow}</p>
            <h2 className="mt-5 font-heading text-4xl leading-[1.15] md:text-5xl">
              {headingLines.map((line, i) => (
                <span key={line + i}>
                  {line}
                  {i < headingLines.length - 1 && <br />}
                </span>
              ))}
            </h2>
          </div>
          <div className="max-w-xl">
            <p className="prose-serif">{settings.studioBody}</p>
            <Link href="/about" className="nav-link mt-4 inline-block">
              About the studio
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center md:py-32">
        <p className="eyebrow">Start a conversation</p>
        <h2 className="mx-auto mt-5 max-w-3xl font-heading text-4xl leading-tight md:text-6xl">
          Tell us about your space.
        </h2>
        <Link href="/contact" className="btn mt-10">
          Get in touch
        </Link>
      </section>
    </>
  )
}