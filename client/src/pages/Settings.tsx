import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import ThemePicker from '../components/ThemePicker'
import { NAV_ORDER_EVENT, isDefaultNavOrder, loadNavOrder, resetNavOrder } from '../lib/navOrder'
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
      } else if (changeError.code === 'CREDENTIAL_ACCOUNT_NOT_FOUND') {
        setError(
          'You sign in with Google, so this account has no password yet. To add one, log out and use "Forgot password?" on the log in page.',
        )
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

// Google sign-ups have no password. This adds one, so they can also log in with email and password.
function SetPasswordForm({ onDone }: { onDone: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setError('Password must be at least 8 characters and match the confirmation.')
      return
    }

    setSaving(true)
    try {
      const result = await fetch('/api/account/set-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      if (!result.ok) {
        const data = await result.json().catch(() => ({}))
        setError(data.error || 'Could not set your password. Try again.')
        return
      }
      onDone()
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setSaving(false)
    }
  }

  let submitText = 'Set password'
  if (saving) {
    submitText = 'Saving…'
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h3 className="settings-subtitle">Set a password</h3>
      <p className="settings-note">
        You sign in with Google. Add a password if you also want to log in with your email.
      </p>
      <PasswordInput
        label="New password"
        value={newPassword}
        onChange={(value) => {
          setNewPassword(value)
          setError('')
        }}
        autoComplete="new-password"
      />
      <PasswordInput
        label="Confirm new password"
        value={confirmPassword}
        onChange={(value) => {
          setConfirmPassword(value)
          setError('')
        }}
        autoComplete="new-password"
      />

      {error && <p className="auth-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary settings-submit" disabled={saving}>
        {submitText}
      </button>
    </form>
  )
}

// Appearance → Menu order: shows whether the top menu was rearranged, and puts it back
function MenuOrderSetting() {
  const [isDefault, setIsDefault] = useState(() => isDefaultNavOrder(loadNavOrder()))

  useEffect(() => {
    function refresh() {
      setIsDefault(isDefaultNavOrder(loadNavOrder()))
    }
    window.addEventListener(NAV_ORDER_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(NAV_ORDER_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return (
    <div className="settings-row-toggle settings-menu-order">
      <div>
        <p className="settings-row-title">Menu order</p>
        <p className="settings-note">Drag the pages in the top menu to rearrange them. Saved on this device.</p>
      </div>
      <button
        type="button"
        className="btn btn-secondary settings-small-btn"
        onClick={() => {
          resetNavOrder()
          setIsDefault(true)
        }}
        disabled={isDefault}
      >
        Reset menu order
      </button>
    </div>
  )
}

const CONFIRM_WORD = 'DELETE'

// Danger zone: permanently deletes the account and everything in it.
// People with a password must enter it; everyone types DELETE so it can't happen by accident.
function DeleteAccountSection({ hasPassword }: { hasPassword: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  function close() {
    setIsOpen(false)
    setPassword('')
    setConfirmText('')
    setError('')
  }

  async function handleDelete(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD || (hasPassword && password === '')) {
      let message = 'Type ' + CONFIRM_WORD + ' to confirm.'
      if (hasPassword) {
        message = 'Enter your password and type ' + CONFIRM_WORD + ' to confirm.'
      }
      setError(message)
      return
    }

    setDeleting(true)
    let body = {}
    if (hasPassword) {
      body = { password }
    }
    const { error: deleteError } = await authClient.deleteUser(body)
    setDeleting(false)

    if (deleteError) {
      if (deleteError.code === 'INVALID_PASSWORD') {
        setError("That password isn't right.")
      } else if (deleteError.code === 'SESSION_EXPIRED') {
        setError('For your safety, log out and log back in, then try again.')
      } else if (deleteError.status === 429) {
        setError('Too many attempts. Wait a minute and try again.')
      } else {
        setError(deleteError.message || 'Could not delete your account. Try again.')
      }
      return
    }

    // The account and login are gone, so start over on the landing page
    window.location.assign('/')
  }

  if (!isOpen) {
    return (
      <div className="settings-danger">
        <h3 className="settings-subtitle">Delete account</h3>
        <p className="settings-note">
          Permanently delete your account and everything in it: jobs, habits and roadmaps. This can't be undone.
        </p>
        <button type="button" className="btn btn-danger-outline" onClick={() => setIsOpen(true)}>
          Delete account
        </button>
      </div>
    )
  }

  let submitText = 'Delete my account'
  if (deleting) {
    submitText = 'Deleting…'
  }

  return (
    <form className="settings-danger settings-danger-open" onSubmit={handleDelete}>
      <h3 className="settings-subtitle">Delete account</h3>
      <p className="settings-danger-warning">
        This permanently deletes your account, every job application, habit and check-in, and all your roadmaps.
        There's no undo.
      </p>
      {hasPassword && (
        <PasswordInput
          label="Your password"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setError('')
          }}
          autoComplete="current-password"
        />
      )}
      <label className="auth-field">
        <span>
          Type <strong>{CONFIRM_WORD}</strong> to confirm
        </span>
        <input
          type="text"
          value={confirmText}
          onChange={(event) => {
            setConfirmText(event.target.value)
            setError('')
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="settings-danger-actions">
        <button type="submit" className="btn btn-danger" disabled={deleting}>
          {submitText}
        </button>
        <button type="button" className="btn btn-secondary" onClick={close} disabled={deleting}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Settings() {
  const { data: session } = authClient.useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  // Whether this account has a password. Google sign-ups start without one; null while loading.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [passwordAdded, setPasswordAdded] = useState(false)

  useEffect(() => {
    let cancelled = false
    authClient.listAccounts().then((result) => {
      if (!cancelled && result.data) {
        setHasPassword(result.data.some((account) => account.providerId === 'credential'))
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

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
            {passwordAdded && (
              <p className="settings-success" role="status">
                Password set. You can now log in with Google or with your email and password.
              </p>
            )}
            {hasPassword === true && <ChangePasswordForm />}
            {hasPassword === false && (
              <SetPasswordForm
                onDone={() => {
                  setHasPassword(true)
                  setPasswordAdded(true)
                }}
              />
            )}
            {hasPassword !== null && <DeleteAccountSection hasPassword={hasPassword} />}
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
            <MenuOrderSetting />
          </section>
        )}
      </div>
    </div>
  )
}
