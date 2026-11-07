import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { UPLOAD_DIR, imageExists, nearestSize } from '@/lib/images'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params
  const key = segments.join('/')

  // Reject traversal and anything that is not a generated variant.
  if (!key || key.includes('..') || key.includes('\0') || key.startsWith('/')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const requested = Number(new URL(request.url).searchParams.get('w') ?? '1280')
  const size = nearestSize(Number.isFinite(requested) && requested > 0 ? requested : 1280)

  if (!(await imageExists(key, size))) {
    return new NextResponse('Not found', { status: 404 })
  }

  const file = path.join(UPLOAD_DIR, `${key}@${size}.webp`)

  // Guard: resolved path must stay inside UPLOAD_DIR.
  const resolved = path.resolve(file)
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const buf = await readFile(resolved)
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'content-type': 'image/webp',
      'content-length': String(buf.byteLength),
      // Uploads are never HTML; nosniff + attachment-safe inline.
      'x-content-type-options': 'nosniff',
      'content-disposition': 'inline',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}