import type { Metadata } from 'next'
import Link from 'next/link'
import EmailLink from '@/components/public/EmailLink'
import SocialLinks from '@/components/public/SocialLinks'
import { getSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Quin — interior architecture and design, Kuala Lumpur.',
}

export default async function ContactPage() {
  const settings = await getSettings()
  const [emailUser, emailDomain] = settings.contactEmail.split('@')
  const hasSocial = Boolean(settings.instagramUrl || settings.linkedinUrl || settings.facebookUrl)

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-10 md:px-8 md:pt-14">
      <nav className="text-[10px] uppercase tracking-[0.18em] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2 text-muted/50">/</span>
        <span className="text-ink">Contact</span>
      </nav>

      <div className="mt-10 border-y border-line py-16 text-center md:py-20">
        <h1 className="page-title">Contact us</h1>
      </div>

      <div className="mx-auto max-w-3xl py-16 md:py-20">
        {/* Direct */}
        <section className="grid gap-4 md:grid-cols-[180px_1fr] md:gap-10">
          <h2 className="eyebrow md:pt-1">Direct</h2>
          <div className="space-y-1 text-[0.95rem] font-light">
            {settings.contactName && <p className="text-ink">{settings.contactName}</p>}
            <p className="text-muted">
              T:{' '}
              <a
                href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}
                className="text-ink transition-colors hover:text-brass"
              >
                {settings.contactPhone}
              </a>
            </p>
            <p className="text-muted">
              E:{' '}
              <EmailLink
                user={emailUser}
                domain={emailDomain ?? ''}
                className="text-ink transition-colors hover:text-brass"
              />
            </p>
            <p className="pt-4">
              <EmailLink
                user={emailUser}
                domain={emailDomain ?? ''}
                subject="Design appointment"
                className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] transition-colors hover:text-brass"
                label={
                  <>
                    Design appointment
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </>
                }
              />
            </p>
          </div>
        </section>

        <hr className="my-10 border-line" />

        {/* Showroom */}
        <section className="grid gap-4 md:grid-cols-[180px_1fr] md:gap-10">
          <h2 className="eyebrow md:pt-1">Showroom &amp; office</h2>
          <div className="space-y-1 text-[0.95rem] font-light">
            {settings.showroomName && <p className="text-ink">{settings.showroomName}</p>}
            <p className="whitespace-pre-line text-muted">{settings.address}</p>
            {settings.hours && <p className="text-muted">{settings.hours}</p>}
            {settings.mapUrl && (
              <p className="pt-3">
                <a
                  href={settings.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] transition-colors hover:text-brass"
                >
                  View on map
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </p>
            )}
          </div>
        </section>

        {hasSocial && (
          <>
            <hr className="my-10 border-line" />
            <section className="grid gap-4 md:grid-cols-[180px_1fr] md:gap-10">
              <h2 className="eyebrow md:pt-1">Social Media</h2>
              <SocialLinks settings={settings} />
            </section>
          </>
        )}

        <hr className="my-10 border-line" />

        <section className="grid gap-4 md:grid-cols-[180px_1fr] md:gap-10">
          <h2 className="eyebrow md:pt-1">Email</h2>
          <div className="space-y-2 text-[0.95rem] font-light text-muted">
            <p>
              New projects and general enquiries:{' '}
              <EmailLink
                user={emailUser}
                domain={emailDomain ?? ''}
                className="text-ink transition-colors hover:text-brass"
              />
            </p>
            <p>We reply to every enquiry within two working days.</p>
          </div>
        </section>
      </div>
    </div>
  )
}