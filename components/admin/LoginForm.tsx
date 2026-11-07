'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/actions/auth'

const initial: LoginState = {}

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initial)

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="username" className="label">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          autoFocus
          className="field"
        />
      </div>

      <div>
        <label htmlFor="accessId" className="label">
          Access ID
        </label>
        <input
          id="accessId"
          name="accessId"
          type="password"
          autoComplete="current-password"
          required
          className="field"
        />
      </div>

      <div aria-live="polite" aria-atomic="true">
        {state.error && (
          <p className="border border-red-700/30 bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        )}
      </div>

      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}