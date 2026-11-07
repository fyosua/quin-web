import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const version = process.env.APP_VERSION ?? 'dev'
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json(
      { status: 'ok', db: 'ok', version, env: process.env.APP_ENV ?? 'unknown', time: new Date().toISOString() },
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (err) {
    console.error('health check failed', err)
    return NextResponse.json(
      { status: 'degraded', db: 'down', version, env: process.env.APP_ENV ?? 'unknown' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    )
  }
}