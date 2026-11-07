'use client'

import { useActionState } from 'react'
import { submitContact, type ContactState } from '@/actions/contact'

const initial: ContactState = { ok: false, message: '' }

export default function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial)

  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">
            Name *
          </label>
          <input id="name" name="name" required autoComplete="name" className="field" />
          {state.errors?.name && <p className="mt-1 text-xs text-red-700">{state.errors.name[0]}</p>}
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email *
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
          {state.errors?.email && <p className="mt-1 text-xs text-red-700">{state.errors.email[0]}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" />
        </div>
        <div>
          <label htmlFor="subject" className="label">
            Subject *
          </label>
          <select id="subject" name="subject" className="field" defaultValue="Project enquiry">
            <option>Project enquiry</option>
            <option>Collaboration</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="label">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={7}
          required
          minLength={20}
          maxLength={2000}
          className="field resize-y"
          placeholder="Tell us about the space, timeline and budget range."
        />
        {state.errors?.message && (
          <p className="mt-1 text-xs text-red-700">{state.errors.message[0]}</p>
        )}
      </div>

      {/* Honeypot — hidden from users, visible to naive bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Sending…' : 'Send message'}
        </button>
        <p className="text-xs text-muted">We reply within two working days.</p>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {state.message && (
          <p
            className={`mt-2 border px-4 py-3 text-sm ${
              state.ok ? 'border-brass/40 bg-surface text-ink' : 'border-red-500/30 bg-red-950/40 text-red-300'
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}