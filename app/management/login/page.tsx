import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/admin/LoginForm'
import { getSessionUser } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const user = await getSessionUser()
  if (user) redirect('/management')

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <p className="font-heading text-xl uppercase tracking-[0.3em]">Quin</p>
        <h1 className="mt-8 font-heading text-3xl">Client &amp; studio access</h1>
        <p className="mt-2 text-sm text-muted">Sign in with your username and Access ID.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-8 text-[11px] uppercase tracking-[0.14em] text-muted">
          Authorised access only. Attempts are logged.
        </p>
      </div>
    </div>
  )
}