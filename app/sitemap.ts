import type { MetadataRoute } from 'next'
import { getAllPublishedSlugs } from '@/lib/projects'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const noindex = process.env.ROBOTS_NOINDEX === 'true'
  if (noindex) return []

  let projects: { slug: string; updatedAt: Date }[] = []
  try {
    projects = await getAllPublishedSlugs()
  } catch {
    projects = []
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  return [
    ...staticRoutes,
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}