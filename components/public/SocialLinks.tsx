import type { SiteSettings } from '@/lib/settings'

type Kind = 'instagram' | 'linkedin' | 'facebook'

const PATHS: Record<Kind, React.ReactNode> = {
  instagram: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" />
    </>
  ),
  linkedin: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M7.2 10.2v7.1M7.2 7.3v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M11 17.3v-7.1m0 2.4c0-1.4 1.1-2.4 2.5-2.4s2.5 1 2.5 2.4v4.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  facebook: (
    <path
      d="M14.6 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.4-1.4h1.6V4.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2H8.9v2.9h2.5V21"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      fill="none"
    />
  ),
}

const LABEL: Record<Kind, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
}

export default function SocialLinks({
  settings,
  size = 'md',
}: {
  settings: SiteSettings
  size?: 'sm' | 'md'
}) {
  const links: [Kind, string | null][] = [
    ['instagram', settings.instagramUrl],
    ['linkedin', settings.linkedinUrl],
    ['facebook', settings.facebookUrl],
  ]

  const active = links.filter((entry): entry is [Kind, string] => Boolean(entry[1]))
  if (active.length === 0) return null

  const box = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'

  return (
    <ul className="flex items-center gap-3">
      {active.map(([kind, href]) => (
        <li key={kind}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={LABEL[kind]}
            title={LABEL[kind]}
            className={`flex items-center justify-center border border-line text-muted transition-colors hover:border-brass hover:text-brass ${box}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className={icon} fill="none">
              {PATHS[kind]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}