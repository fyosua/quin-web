'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/guard'
import { clientIp } from '@/lib/ip'
import { writeAudit } from '@/lib/audit'
import { emptyToNull, projectSchema, slugify } from '@/lib/validation'
import { deleteImageFiles, processUpload, MAX_BYTES } from '@/lib/images'

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string[]> }

function revalidateProject(slug?: string | null, oldSlug?: string | null) {
  revalidatePath('/')
  revalidatePath('/projects')
  if (slug) revalidatePath(`/projects/${slug}`)
  if (oldSlug && oldSlug !== slug) revalidatePath(`/projects/${oldSlug}`)
}

function parseForm(formData: FormData) {
  return projectSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug') || slugify(String(formData.get('title') ?? '')),
    summary: formData.get('summary'),
    description: formData.get('description'),
    category: formData.get('category'),
    location: formData.get('location') ?? '',
    year: formData.get('year') || undefined,
    areaM2: formData.get('areaM2') || undefined,
    client: formData.get('client') ?? '',
    status: formData.get('status') ?? 'DRAFT',
    featured: formData.get('featured') === 'on',
  })
}

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin()
  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { ok: false, message: 'Please fix the highlighted fields.', errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const data = parsed.data
  const clash = await prisma.project.findFirst({
    where: { OR: [{ slug: data.slug }, { slugHistory: { some: { oldSlug: data.slug } } }] },
    select: { id: true },
  })
  if (clash) return { ok: false, message: 'That slug is already in use.', errors: { slug: ['Already in use.'] } }

  const max = await prisma.project.aggregate({ _max: { sortOrder: true } })
  const project = await prisma.project.create({
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      description: data.description,
      category: data.category,
      location: emptyToNull(data.location),
      year: data.year === '' || data.year === undefined ? null : Number(data.year),
      areaM2: data.areaM2 === '' || data.areaM2 === undefined ? null : Number(data.areaM2),
      client: emptyToNull(data.client),
      status: data.status,
      featured: Boolean(data.featured),
      sortOrder: (max._max.sortOrder ?? 0) + 10,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
  })

  await writeAudit({
    userId: user.id,
    action: 'PROJECT_CREATE',
    entity: 'Project',
    entityId: project.id,
    meta: { slug: project.slug, status: project.status },
    ip: await clientIp(),
  })

  revalidateProject(project.slug)
  redirect(`/management/projects/${project.id}`)
}

export async function updateProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, message: 'Missing project id.' }

  const parsed = parseForm(formData)
  if (!parsed.success) {
    return { ok: false, message: 'Please fix the highlighted fields.', errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) return { ok: false, message: 'Project not found.' }

  const data = parsed.data
  if (data.slug !== existing.slug) {
    const clash = await prisma.project.findFirst({
      where: { OR: [{ slug: data.slug }, { slugHistory: { some: { oldSlug: data.slug } } }], NOT: { id } },
      select: { id: true },
    })
    if (clash) return { ok: false, message: 'That slug is already in use.', errors: { slug: ['Already in use.'] } }

    await prisma.slugHistory.create({ data: { projectId: id, oldSlug: existing.slug } }).catch(() => {})
  }

  const newlyPublished = existing.status !== 'PUBLISHED' && data.status === 'PUBLISHED'

  await prisma.project.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      description: data.description,
      category: data.category,
      location: emptyToNull(data.location),
      year: data.year === '' || data.year === undefined ? null : Number(data.year),
      areaM2: data.areaM2 === '' || data.areaM2 === undefined ? null : Number(data.areaM2),
      client: emptyToNull(data.client),
      status: data.status,
      featured: Boolean(data.featured),
      publishedAt: newlyPublished ? new Date() : data.status === 'DRAFT' ? null : existing.publishedAt,
    },
  })

  await writeAudit({
    userId: user.id,
    action: 'PROJECT_UPDATE',
    entity: 'Project',
    entityId: id,
    meta: { slug: data.slug, status: data.status },
    ip: await clientIp(),
  })

  revalidateProject(data.slug, existing.slug)
  return { ok: true, message: 'Saved.' }
}

export async function setProjectStatus(id: string, status: 'DRAFT' | 'PUBLISHED') {
  const user = await requireAdmin()
  const project = await prisma.project.update({
    where: { id },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
    select: { slug: true },
  })
  await writeAudit({ userId: user.id, action: `PROJECT_${status}`, entity: 'Project', entityId: id, ip: await clientIp() })
  revalidateProject(project.slug)
}

export async function softDeleteProject(id: string) {
  const user = await requireAdmin()
  const project = await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'DRAFT' },
    select: { slug: true },
  })
  await writeAudit({ userId: user.id, action: 'PROJECT_DELETE', entity: 'Project', entityId: id, ip: await clientIp() })
  revalidateProject(project.slug)
  redirect('/management')
}

export async function reorderProjects(ids: string[]) {
  const user = await requireAdmin()
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.project.update({ where: { id }, data: { sortOrder: (index + 1) * 10 } }),
    ),
  )
  await writeAudit({ userId: user.id, action: 'PROJECT_REORDER', entity: 'Project', meta: { count: ids.length }, ip: await clientIp() })
  revalidatePath('/')
  revalidatePath('/projects')
}

export async function uploadImages(projectId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin()
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, title: true, slug: true } })
  if (!project) return { ok: false, message: 'Project not found.' }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return { ok: false, message: 'Choose at least one image.' }
  if (files.length > 6) return { ok: false, message: 'Upload up to 6 images at a time.' }

  const existingCount = await prisma.projectImage.count({ where: { projectId } })
  if (existingCount + files.length > 40) return { ok: false, message: 'A project can hold at most 40 images.' }

  const created: string[] = []
  for (const file of files) {
    if (file.size > MAX_BYTES) return { ok: false, message: `${file.name} is larger than 15 MB.` }
    try {
      const processed = await processUpload(projectId, file)
      const img = await prisma.projectImage.create({
        data: {
          projectId,
          fileKey: processed.fileKey,
          width: processed.width,
          height: processed.height,
          alt: project.title,
          sortOrder: existingCount * 10 + created.length * 10,
        },
      })
      created.push(img.id)
    } catch (err) {
      console.error('upload failed', file.name, err)
      return { ok: false, message: `Could not process ${file.name}. Use JPG, PNG, WebP or AVIF under 15 MB.` }
    }
  }

  // First image becomes the cover automatically.
  if (existingCount === 0 && created[0]) {
    await prisma.project.update({ where: { id: projectId }, data: { coverImageId: created[0] } })
  }

  await writeAudit({ userId: user.id, action: 'IMAGE_UPLOAD', entity: 'Project', entityId: projectId, meta: { count: created.length }, ip: await clientIp() })
  revalidateProject(project.slug)
  return { ok: true, message: `${created.length} image${created.length === 1 ? '' : 's'} uploaded.` }
}

export async function updateImage(projectId: string, imageId: string, alt: string) {
  const user = await requireAdmin()
  const trimmed = alt.trim()
  if (trimmed.length < 3) return { ok: false, message: 'Alt text needs at least 3 characters.' }

  await prisma.projectImage.update({ where: { id: imageId }, data: { alt: trimmed } })
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } })
  await writeAudit({ userId: user.id, action: 'IMAGE_ALT', entity: 'ProjectImage', entityId: imageId, ip: await clientIp() })
  revalidateProject(project?.slug)
  return { ok: true, message: 'Alt text saved.' }
}

export async function setCoverImage(projectId: string, imageId: string) {
  const user = await requireAdmin()
  await prisma.project.update({ where: { id: projectId }, data: { coverImageId: imageId } })
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } })
  await writeAudit({ userId: user.id, action: 'IMAGE_COVER', entity: 'ProjectImage', entityId: imageId, ip: await clientIp() })
  revalidateProject(project?.slug)
  revalidatePath('/management')
}

export async function deleteImage(projectId: string, imageId: string) {
  const user = await requireAdmin()
  const image = await prisma.projectImage.findUnique({ where: { id: imageId } })
  if (!image) return

  await prisma.projectImage.delete({ where: { id: imageId } })
  await deleteImageFiles(image.fileKey)

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true, coverImageId: true } })
  if (project?.coverImageId === imageId) {
    const next = await prisma.projectImage.findFirst({ where: { projectId }, orderBy: { sortOrder: 'asc' } })
    await prisma.project.update({ where: { id: projectId }, data: { coverImageId: next?.id ?? null } })
  }

  await writeAudit({ userId: user.id, action: 'IMAGE_DELETE', entity: 'ProjectImage', entityId: imageId, ip: await clientIp() })
  revalidateProject(project?.slug)
}

export async function reorderImages(projectId: string, ids: string[]) {
  const user = await requireAdmin()
  await prisma.$transaction(
    ids.map((id, index) => prisma.projectImage.update({ where: { id }, data: { sortOrder: (index + 1) * 10 } })),
  )
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } })
  await writeAudit({ userId: user.id, action: 'IMAGE_REORDER', entity: 'Project', entityId: projectId, ip: await clientIp() })
  revalidateProject(project?.slug)
}