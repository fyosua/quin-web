'use client'

import { useEffect, useState } from 'react'

/**
 * Cloudflare's "Email Address Obfuscation" rewrites literal addresses in the HTML into
 * /cdn-cgi/l/email-protection and depends on an injected script that our nonce CSP
 * blocks. Splitting the address into separate text nodes and building the mailto: href
 * on the client keeps the address readable and clickable either way.
 */
export default function EmailLink({
  user,
  domain,
  className,
  label,
  subject,
}: {
  user: string
  domain: string
  className?: string
  label?: React.ReactNode
  subject?: string
}) {
  const [href, setHref] = useState<string>('#')

  useEffect(() => {
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : ''
    setHref(`mailto:${user}@${domain}${query}`)
  }, [user, domain, subject])

  return (
    <a href={href} className={className}>
      {label ?? (
        <>
          <span>{user}</span>
          <span aria-hidden="true">@</span>
          <span>{domain}</span>
        </>
      )}
    </a>
  )
}