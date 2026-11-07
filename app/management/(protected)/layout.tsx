import Link from 'next/link'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'
import { getSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/management/login')

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/management" className="font-heading text-lg uppercase tracking-[0.28em]">
              Quin
            </Link>
            <nav className="hidden items-center gap-6 sm:flex" aria-label="Admin">
              <Link href="/management" className="nav-link" data-active="false">
                Projects
              </Link>
              <Link href="/" className="nav-link" data-active="false" target="_blank">
                View site ↗
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/management/account" className="text-xs text-muted hover:text-ink">
              {user.username}
            </Link>
            <form action={logout}>
              <button type="submit" className="text-xs uppercase tracking-[0.14em] text-muted hover:text-ink">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-10">{children}</main>
    </div>
  )
}