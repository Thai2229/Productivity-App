import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import ThemePicker from '../components/ThemePicker'
import { authClient } from '../lib/auth-client'
import '../profile.css'

type Tab = 'account' | 'appearance'

// A password box with an eye button that shows or hides what you've typed
function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)

  let type = 'password'
  let buttonLabel = 'Show password'
  if (visible) {
    type = 'text'
    buttonLabel = 'Hide password'
  }

  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="password-box">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          maxLength={128}
          required
        />
        <button
          type="button"
          className="password-eye"
          aria-label={buttonLabel}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible && (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z" />
              <circle cx="8" cy="8" r="2" />
              <path d="M2.5 2.5l11 11" />
            </svg>
          )}
          {!visible && (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z" />
              <circle cx="8" cy="8" r="2" />
            </svg>
          )}
        </button>
      </span>
    </label>
  )
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signOutOthers, setSignOutOthers] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  // Typing again clears the last error or success message
  function edit(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setError('')
      setSuccess('')
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 8 || newPassword !== confirmPassword || newPassword === currentPassword) {
      setError(
        'New password must be at least 8 characters, match the confirmation, and be different from your current one.',
      )
      return
    }

    setSaving(true)
    // The server checks the current password before changing anything
    const { error: changeError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: signOutOthers,
    })
    setSaving(false)

    if (changeError) {
      if (changeError.code === 'INVALID_PASSWORD') {
        setError('Your current password is incorrect.')
      } else if (changeError.status === 429) {
        setError('Too many attempts. Wait a few seconds and try again.')
      } else {
        setError(changeError.message || 'Could not change your password.')
      }
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSuccess('Password changed.')
  }

  let submitText = 'Change password'
  if (saving) {
    submitText = 'Saving…'
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h3 className="settings-subtitle">Change password</h3>
      <PasswordInput
        label="Current password"
        value={currentPassword}
        onChange={edit(setCurrentPassword)}
        autoComplete="current-password"
      />
      <PasswordInput label="New password" value={newPassword} onChange={edit(setNewPassword)} autoComplete="new-password" />
      <PasswordInput
        label="Confirm new password"
        value={confirmPassword}
        onChange={edit(setConfirmPassword)}
        autoComplete="new-password"
      />
      <label className="settings-check">
        <input type="checkbox" checked={signOutOthers} onChange={(event) => setSignOutOthers(event.target.checked)} />
        Sign out of other devices
      </label>

      {error && <p className="auth-error" role="alert">{error}</p>}
      {success && <p className="settings-success" role="status">{success}</p>}

      <button type="submit" className="btn btn-primary settings-submit" disabled={saving}>
        {submitText}
      </button>
    </form>
  )
}

export default function Settings() {
  const { data: session } = authClient.useSession()
  const [searchParams, setSearchParams] = useSearchParams()

  let tab: Tab = 'account'
  if (searchParams.get('tab') === 'appearance') {
    tab = 'appearance'
  }

  if (!session) {
    return null
  }

  let name = session.user.name.trim()
  if (name === '') {
    name = '—'
  }

  return (
    <div className="settings">
      <h1 className="tracker-title">Settings</h1>

      <div className="settings-layout">
        <nav className="settings-tabs" aria-label="Settings sections">
          <button type="button" aria-current={tab === 'account'} onClick={() => setSearchParams({})}>
            Account
          </button>
          <button
            type="button"
            aria-current={tab === 'appearance'}
            onClick={() => setSearchParams({ tab: 'appearance' })}
          >
            Appearance
          </button>
        </nav>

        {tab === 'account' && (
          <section className="settings-card">
            <h2 className="settings-heading">Account</h2>
            <dl className="settings-rows">
              <div>
                <dt>Name</dt>
                <dd>{name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{session.user.email}</dd>
              </div>
            </dl>
            <ChangePasswordForm />
          </section>
        )}

        {tab === 'appearance' && (
          <section className="settings-card">
            <h2 className="settings-heading">Appearance</h2>
            <div className="settings-theme">
              <div>
                <p className="settings-row-title">Theme</p>
                <p className="settings-note">Saved on this device.</p>
              </div>
              <ThemePicker />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
