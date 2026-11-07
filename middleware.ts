import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'q_session'

/**
 * Prerendered/ISR pages bake their inline <script> tags into the cached HTML, so a
 * per-request nonce can never match them — the browser would block every script and the
 * page would never hydrate (no autoplay, no clicks). We allow inline scripts from our own
 * origin instead (React escapes by default and markdown is sanitised server-side) and
 * keep the rest of the policy strict.
 */
function cspFor() {
  const dev = process.env.NODE_ENV !== 'production'
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isManagement = pathname.startsWith('/management')
  const isLogin = pathname === '/management/login'

  // Cheap gate only. Real verification happens in the protected layout and in every action.
  if (isManagement && !isLogin && !request.cookies.get(SESSION_COOKIE)) {
    const url = request.nextUrl.clone()
    url.pathname = '/management/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()

  response.headers.set('content-security-policy', cspFor())
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  response.headers.set('x-frame-options', 'DENY')
  response.headers.set(
    'permissions-policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  )
  if (isManagement) {
    response.headers.set('x-robots-tag', 'noindex, nofollow')
    response.headers.set('cache-control', 'no-store, max-age=0')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/uploads).*)'],
}