import ChangePasswordForm from '@/components/admin/ChangePasswordForm'
import SiteSettingsForm from '@/components/admin/SiteSettingsForm'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/guard'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await requireAdmin()
  const [record, settings] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: user.id },
      select: { lastLoginAt: true, passwordChangedAt: true },
    }),
    getSettings(),
  ])

  return (
    <div className="max-w-3xl space-y-16">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 font-heading text-4xl">Settings</h1>

        <dl className="mt-8 grid grid-cols-2 gap-y-3 border-y border-line py-5 text-sm">
          <dt className="text-muted">Username</dt>
          <dd>{user.username}</dd>
          <dt className="text-muted">Last sign-in</dt>
          <dd>{record?.lastLoginAt ? record.lastLoginAt.toLocaleString() : '—'}</dd>
          <dt className="text-muted">Password changed</dt>
          <dd>{record?.passwordChangedAt ? record.passwordChangedAt.toLocaleString() : 'never'}</dd>
        </dl>
      </div>

      <section>
        <h2 className="font-heading text-2xl">Site content</h2>
        <p className="mt-1 text-sm text-muted">
          These texts appear on the public home page, in the footer and on the contact page. Saving
          refreshes the live site immediately.
        </p>
        <div className="mt-8">
          <SiteSettingsForm settings={settings} />
        </div>
      </section>

      <section className="border-t border-line pt-10">
        <h2 className="font-heading text-2xl">Change password</h2>
        <p className="mt-1 text-sm text-muted">
          Changing your password signs out every other browser. The Access ID printed by the CLI is the
          same secret as this password.
        </p>
        <div className="mt-8 max-w-xl">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  )
}