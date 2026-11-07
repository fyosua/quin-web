'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">500</p>
      <h1 className="mt-4 font-heading text-4xl">Something went wrong.</h1>
      <p className="mt-3 text-muted">The page could not be rendered. Try again in a moment.</p>
      <button type="button" onClick={reset} className="btn mt-8">
        Try again
      </button>
    </div>
  )
}