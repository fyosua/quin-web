'use client'

import { useActionState } from 'react'
import { updateSiteSettings, type SettingsState } from '@/actions/settings'
import type { SiteSettings } from '@/lib/settings'

export default function SiteSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(updateSiteSettings, {} as SettingsState)

  return (
    <form action={action} className="space-y-8" autoComplete="off">
      <fieldset className="space-y-5">
        <legend className="eyebrow">Studio statement (home page)</legend>

        <div>
          <label htmlFor="studioEyebrow" className="label">
            Small label above the heading
          </label>
          <input
            id="studioEyebrow"
            name="studioEyebrow"
            defaultValue={settings.studioEyebrow}
            maxLength={60}
            className="field"
            required
          />
          {state.errors?.studioEyebrow && (
            <p className="mt-1 text-xs text-red-400">{state.errors.studioEyebrow[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="studioHeading" className="label">
            Heading (line breaks are kept)
          </label>
          <textarea
            id="studioHeading"
            name="studioHeading"
            defaultValue={settings.studioHeading}
            rows={2}
            maxLength={160}
            className="field resize-y"
            required
          />
        </div>

        <div>
          <label htmlFor="studioBody" className="label">
            Paragraph
          </label>
          <textarea
            id="studioBody"
            name="studioBody"
            defaultValue={settings.studioBody}
            rows={5}
            maxLength={1200}
            className="field resize-y"
            required
          />
          {state.errors?.studioBody && (
            <p className="mt-1 text-xs text-red-400">{state.errors.studioBody[0]}</p>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="eyebrow">Contact page &amp; footer</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contactName" className="label">
              Direct contact name
            </label>
            <input
              id="contactName"
              name="contactName"
              defaultValue={settings.contactName}
              placeholder="Studio enquiries"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="label">
              Email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={settings.contactEmail}
              className="field"
              required
            />
            {state.errors?.contactEmail && (
              <p className="mt-1 text-xs text-red-400">{state.errors.contactEmail[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="contactPhone" className="label">
              Phone / hotline
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              defaultValue={settings.contactPhone}
              className="field"
              required
            />
          </div>
          <div>
            <label htmlFor="showroomName" className="label">
              Showroom name
            </label>
            <input
              id="showroomName"
              name="showroomName"
              defaultValue={settings.showroomName}
              placeholder="Quin Studio"
              className="field"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="label">
              Address (use line breaks for a multi-line address)
            </label>
            <textarea
              id="address"
              name="address"
              defaultValue={settings.address}
              rows={3}
              maxLength={240}
              className="field resize-y"
              required
            />
          </div>
          <div>
            <label htmlFor="hours" className="label">
              Opening hours / note
            </label>
            <input id="hours" name="hours" defaultValue={settings.hours} className="field" />
          </div>
          <div>
            <label htmlFor="mapUrl" className="label">
              Map link (optional)
            </label>
            <input
              id="mapUrl"
              name="mapUrl"
              defaultValue={settings.mapUrl ?? ''}
              placeholder="https://maps.google.com/…"
              className="field"
            />
            {state.errors?.mapUrl && (
              <p className="mt-1 text-xs text-red-400">{state.errors.mapUrl[0]}</p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-line pt-8">
        <legend className="eyebrow">Elsewhere (social links)</legend>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="instagramUrl" className="label">
              Instagram
            </label>
            <input
              id="instagramUrl"
              name="instagramUrl"
              defaultValue={settings.instagramUrl ?? ''}
              placeholder="https://instagram.com/…"
              className="field"
            />
            {state.errors?.instagramUrl && (
              <p className="mt-1 text-xs text-red-400">{state.errors.instagramUrl[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="linkedinUrl" className="label">
              LinkedIn
            </label>
            <input
              id="linkedinUrl"
              name="linkedinUrl"
              defaultValue={settings.linkedinUrl ?? ''}
              placeholder="https://linkedin.com/…"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="facebookUrl" className="label">
              Facebook
            </label>
            <input
              id="facebookUrl"
              name="facebookUrl"
              defaultValue={settings.facebookUrl ?? ''}
              placeholder="https://facebook.com/…"
              className="field"
            />
          </div>
        </div>
        <p className="text-xs text-muted">Leave a field empty to hide that link on the public site.</p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Saving…' : 'Save site content'}
        </button>
        {state.message && (
          <p className={`text-sm ${state.ok ? 'text-brass' : 'text-red-400'}`} aria-live="polite">
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}