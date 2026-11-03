import { useState, type FormEvent } from 'react'
import { STAGES, type Internship, type InternshipDraft, type Stage } from '../lib/internships'

type Props = {
  initial: Internship | null
  onSave: (draft: InternshipDraft) => Promise<void>
  onCancel: () => void
}

function todayText() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return now.getFullYear() + '-' + month + '-' + day
}

// Turns a saved row (or nothing, when adding) into form values
function toDraft(internship: Internship | null): InternshipDraft {
  if (!internship) {
    return {
      company: '',
      role: '',
      stage: 'APPLIED',
      location: '',
      link: '',
      appliedOn: todayText(),
      notes: '',
    }
  }

  let appliedOn = ''
  if (internship.appliedOn) {
    appliedOn = internship.appliedOn.slice(0, 10)
  }

  return {
    company: internship.company,
    role: internship.role,
    stage: internship.stage,
    location: internship.location ?? '',
    link: internship.link ?? '',
    appliedOn,
    notes: internship.notes ?? '',
  }
}

export default function InternshipForm({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<InternshipDraft>(() => toDraft(initial))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  let title = 'Add job'
  let submitText = 'Add job'
  if (initial) {
    title = 'Edit ' + initial.company
    submitText = 'Save changes'
  }
  if (saving) {
    submitText = 'Saving…'
  }

  function update(field: keyof InternshipDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    const link = draft.link.trim()
    if (draft.company.trim() === '' || draft.role.trim() === '') {
      setError('Company and title are required.')
      return
    }
    if (link !== '' && !link.startsWith('http://') && !link.startsWith('https://')) {
      setError('Link must start with http:// or https://')
      return
    }

    setSaving(true)
    try {
      await onSave(draft)
    } catch (saveError) {
      setError((saveError as Error).message)
      setSaving(false)
    }
  }

  return (
    <form className="tracker-form" onSubmit={handleSubmit}>
      <h2 className="tracker-form-title">{title}</h2>

      <div className="tracker-form-grid">
        <label className="auth-field">
          <span>Company</span>
          <input
            value={draft.company}
            onChange={(event) => update('company', event.target.value)}
            maxLength={100}
            autoFocus
            required
          />
        </label>

        <label className="auth-field">
          <span>Title</span>
          <input
            value={draft.role}
            onChange={(event) => update('role', event.target.value)}
            maxLength={100}
            required
          />
        </label>

        <label className="auth-field">
          <span>Stage</span>
          <select
            value={draft.stage}
            onChange={(event) => update('stage', event.target.value as Stage)}
          >
            {STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-field">
          <span>Applied on</span>
          <input
            type="date"
            value={draft.appliedOn}
            onChange={(event) => update('appliedOn', event.target.value)}
          />
        </label>

        <label className="auth-field">
          <span>Location <span className="auth-hint">(optional)</span></span>
          <input
            value={draft.location}
            onChange={(event) => update('location', event.target.value)}
            maxLength={100}
          />
        </label>

        <label className="auth-field">
          <span>Job posting link <span className="auth-hint">(optional)</span></span>
          <input
            type="url"
            value={draft.link}
            onChange={(event) => update('link', event.target.value)}
            maxLength={500}
            placeholder="https://"
          />
        </label>

        <label className="auth-field tracker-form-wide">
          <span>Notes <span className="auth-hint">(optional)</span></span>
          <textarea
            value={draft.notes}
            onChange={(event) => update('notes', event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Recruiter name, referral, what to prepare…"
          />
        </label>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="tracker-form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {submitText}
        </button>
      </div>
    </form>
  )
}