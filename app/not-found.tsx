import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 font-heading text-5xl">This page has moved on.</h1>
      <p className="mt-4 text-sm font-light text-muted">
        The page you were looking for doesn’t exist, or the project is no longer published.
      </p>
      <div className="mt-10 flex gap-4">
        <Link href="/" className="btn">
          Home
        </Link>
        <Link href="/projects" className="btn btn-ghost">
          Projects
        </Link>
      </div>
    </div>
  )
}