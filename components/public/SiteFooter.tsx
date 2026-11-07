import Link from 'next/link'
import EmailLink from '@/components/public/EmailLink'
import SocialLinks from '@/components/public/SocialLinks'
import type { SiteSettings } from '@/lib/settings'

export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-8 md:py-28">
        <div className="grid gap-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-heading text-2xl uppercase tracking-[0.42em]">Quin</p>
            <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-muted">
              Interior architecture and design. Residential, commercial and hospitality work across
              Southeast Asia.
            </p>
            <Link href="/contact" className="btn mt-8">
              Book an appointment
            </Link>
          </div>

          <div>
            <p className="eyebrow">Studio</p>
            <ul className="mt-5 space-y-3 text-sm font-light">
              <li>
                <EmailLink
                  user={settings.contactEmail.split('@')[0]}
                  domain={settings.contactEmail.split('@')[1] ?? ''}
                  className="transition-colors hover:text-brass"
                />
              </li>
              <li>
                <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="transition-colors hover:text-brass">
                  {settings.contactPhone}
                </a>
              </li>
              <li className="text-muted">{settings.address}</li>
              {settings.hours && <li className="text-muted">{settings.hours}</li>}
            </ul>
          </div>

          <div>
            <p className="eyebrow">Social Media</p>
            <div className="mt-5">
              <SocialLinks settings={settings} size="sm" />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 text-[10px] uppercase tracking-[0.2em] text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Quin. All rights reserved.</p>
          <p>
            Website by{' '}
            <a
              href="https://yosuaf.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink transition-colors hover:text-brass"
            >
              yosuaf.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}