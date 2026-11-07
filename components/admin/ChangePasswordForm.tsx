'use client'

import { useActionState, useState } from 'react'
import { changePassword, type PasswordState } from '@/actions/account'

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as PasswordState)
  const [show, setShow] = useState(false)

  const type = show ? 'text' : 'password'

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="currentPassword" className="label">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type={type}
          autoComplete="current-password"
          required
          className="field"
        />
        {state.errors?.currentPassword && (
          <p className="mt-1 text-xs text-red-700">{state.errors.currentPassword[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="label">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type={type}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className="field"
        />
        <p className="mt-1 text-xs text-muted">
          At least 8 characters. Avoid your username or an obvious word.
        </p>
        {state.errors?.newPassword && (
          <p className="mt-1 text-xs text-red-700">{state.errors.newPassword[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="label">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={type}
          autoComplete="new-password"
          required
          className="field"
        />
        {state.errors?.confirmPassword && (
          <p className="mt-1 text-xs text-red-700">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4" />
        Show passwords
      </label>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Updating…' : 'Change password'}
        </button>
        {state.message && (
          <p className={`text-sm ${state.ok ? 'text-accent' : 'text-red-700'}`} aria-live="polite">
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}