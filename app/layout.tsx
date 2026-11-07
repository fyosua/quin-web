import type { Metadata } from 'next'
import { Cormorant_Garamond, Montserrat } from 'next/font/google'
import './globals.css'

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
})

const sans = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const noindex = process.env.ROBOTS_NOINDEX === 'true'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Quin — Interior Architecture & Design',
    template: '%s — Quin',
  },
  description:
    'A portfolio of residential, commercial and hospitality interiors: calm, material-led spaces designed around the people who use them.',
  openGraph: {
    type: 'website',
    siteName: 'Quin',
    url: siteUrl,
  },
  twitter: { card: 'summary_large_image' },
  robots: noindex
    ? { index: false, follow: false, nocache: true }
    : { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  )
}