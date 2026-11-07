import 'server-only'
import { mkdir, unlink, stat } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
export const SIZES = [640, 1280, 1920] as const
export const MAX_BYTES = 15 * 1024 * 1024

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif'])

export type ProcessedImage = { fileKey: string; width: number; height: number }

function variantPath(fileKey: string, size: number) {
  return path.join(UPLOAD_DIR, `${fileKey}@${size}.webp`)
}

export async function processUpload(projectId: string, file: File): Promise<ProcessedImage> {
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length === 0) throw new Error('Empty file')
  if (buf.length > MAX_BYTES) throw new Error('File is larger than 15 MB')

  const meta = await sharp(buf).metadata()
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new Error('Only JPG, PNG, WebP or AVIF images are accepted')
  }
  if (!meta.width || !meta.height) throw new Error('Unreadable image')

  const fileKey = path.posix.join(projectId, randomBytes(10).toString('hex'))
  await mkdir(path.join(UPLOAD_DIR, projectId), { recursive: true })

  const base = sharp(buf, { failOn: 'error' }).rotate()
  for (const size of SIZES) {
    const width = Math.min(size, meta.width)
    await base
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(variantPath(fileKey, size))
  }

  return { fileKey, width: meta.width, height: meta.height }
}

export async function deleteImageFiles(fileKey: string) {
  await Promise.all(
    SIZES.map((s) => unlink(variantPath(fileKey, s)).catch(() => {})),
  )
}

export async function imageExists(fileKey: string, size: number) {
  try {
    const st = await stat(variantPath(fileKey, size))
    return st.isFile()
  } catch {
    return false
  }
}

export function nearestSize(requested: number): number {
  for (const size of SIZES) if (size >= requested) return size
  return SIZES[SIZES.length - 1]
}