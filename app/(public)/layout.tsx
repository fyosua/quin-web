import SiteFooter from '@/components/public/SiteFooter'
import SiteHeader from '@/components/public/SiteHeader'
import { getSettings } from '@/lib/settings'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
      >
        Skip to content
      </a>
      <SiteHeader hotline={settings.contactPhone} />
      <main id="main" className="pt-20 md:pt-[7.25rem]">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}