import type { ImageLoaderProps } from 'next/image'

/**
 * Custom loader: file keys are transformed into on-the-fly variant URLs served by
 * /api/uploads/[...path]. The route resolves the nearest pre-generated width.
 */
export default function imageLoader({ src, width }: ImageLoaderProps): string {
  const key = src.replace(/^\/+/, '')
  return `/api/uploads/${key}?w=${width}`
}