import 'server-only'
import { prisma } from '@/lib/db'
import type { Category, Prisma } from '@prisma/client'

export const projectInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ProjectInclude

export type ProjectWithImages = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>

export function coverOf(project: ProjectWithImages) {
  return (
    project.images.find((img) => img.id === project.coverImageId) ??
    project.images[0] ??
    null
  )
}

/**
 * Read helpers are fault-tolerant: the image is built before Compose starts Postgres,
 * so a failed query must not break `next build`. Pages are refreshed via /api/revalidate
 * once the seed has run.
 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.warn('[projects] query skipped:', (err as Error).message)
    return fallback
  }
}

export async function getPublishedProjects(category?: Category | 'ALL') {
  return safe(
    () =>
      prisma.project.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          ...(category && category !== 'ALL' ? { category } : {}),
        },
        include: projectInclude,
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
      }),
    [] as ProjectWithImages[],
  )
}

export async function getFeaturedProjects(limit = 5) {
  return safe(
    () =>
      prisma.project.findMany({
        where: { status: 'PUBLISHED', deletedAt: null, featured: true },
        include: projectInclude,
        orderBy: [{ sortOrder: 'asc' }],
        take: limit,
      }),
    [] as ProjectWithImages[],
  )
}

export async function getProjectBySlug(slug: string) {
  return safe(
    () =>
      prisma.project.findFirst({
        where: { slug, status: 'PUBLISHED', deletedAt: null },
        include: projectInclude,
      }),
    null as ProjectWithImages | null,
  )
}

export type SiblingCover = { fileKey: string; alt: string; width: number; height: number }

export type Sibling = {
  slug: string
  title: string
  category: Category
  cover: SiblingCover | null
}

export async function getSiblingProjects(slug: string, category: Category) {
  return safe(
    async () => {
      const rows = await prisma.project.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        select: {
          slug: true,
          title: true,
          category: true,
          sortOrder: true,
          publishedAt: true,
          coverImageId: true,
          images: {
            select: { id: true, fileKey: true, alt: true, width: true, height: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
      })

      const all: Sibling[] = rows.map((row) => {
        const cover =
          row.images.find((img) => img.id === row.coverImageId) ?? row.images[0] ?? null
        return {
          slug: row.slug,
          title: row.title,
          category: row.category as Category,
          cover: cover
            ? { fileKey: cover.fileKey, alt: cover.alt, width: cover.width, height: cover.height }
            : null,
        }
      })

      const idx = all.findIndex((p) => p.slug === slug)
      // Wrap around: the first project's "previous" is the last one, and vice versa.
      const prev = all.length > 1 && idx >= 0 ? all[(idx - 1 + all.length) % all.length] : null
      const next = all.length > 1 && idx >= 0 ? all[(idx + 1) % all.length] : null
      const related = all.filter((p) => p.slug !== slug && p.category === category).slice(0, 3)
      return { prev, next, related }
    },
    { prev: null, next: null, related: [] } as {
      prev: Sibling | null
      next: Sibling | null
      related: Sibling[]
    },
  )
}

export async function getAllPublishedSlugs() {
  return safe(
    () =>
      prisma.project.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
    [] as { slug: string; updatedAt: Date }[],
  )
}

export const CATEGORY_LABEL: Record<Category, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  HOSPITALITY: 'Hospitality',
  OTHER: 'Other',
}

export const CATEGORIES = ['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'HOSPITALITY', 'OTHER'] as const