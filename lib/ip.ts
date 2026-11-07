import 'server-only'
import { headers } from 'next/headers'

/**
 * Resolve the client IP. Staging sits behind Cloudflare Tunnel, production behind
 * Cloudflare + Nginx, so the trusted header is environment-driven (see README).
 */
export function ipFromHeaders(h: Headers): string | null {
  const trusted = process.env.TRUSTED_IP_HEADER
  if (trusted) {
    const v = h.get(trusted)
    if (v) return v.split(',')[0].trim()
  }
  const cf = h.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const xff = h.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = h.get('x-real-ip')
  return real ? real.trim() : null
}

export async function clientIp(): Promise<string | null> {
  return ipFromHeaders(await headers())
}