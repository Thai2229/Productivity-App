import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

const MIN_PASSWORD_LENGTH = 8

// Where the emailed link lands. The link carries a one-time token in the address.
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const linkError = searchParams.get('error')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword !== confirmPassword) {
      setError('Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters and match the confirmation.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const result = await authClient.resetPassword({ newPassword, token })
      if (result.error) {
        if (result.error.code === 'INVALID_TOKEN') {
          setIsExpired(true)
        } else {
          setError(result.error.message || 'Could not reset your password. Try again.')
        }
        return
      }
      setIsDone(true)
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (linkError || token === '' || isExpired) {
    return (
      <div className="auth-card">
        <h1 className="auth-title">This link has expired</h1>
        <p className="auth-text">Reset links work once and only for 1 hour. Ask for a new one and try again.</p>
        <Link className="btn btn-primary auth-submit auth-link-button" to="/forgot-password">
          Send a new link
        </Link>
      </div>
    )
  }

  if (isDone) {
    return (
      <div className="auth-card">
        <h1 className="auth-title">Password updated</h1>
        <p className="auth-text">
          You can log in with your new password now. For safety, you've been logged out on every device.
        </p>
        <Link className="btn btn-primary auth-submit auth-link-button" to="/login">
          Log in
        </Link>
      </div>
    )
  }

  let buttonLabel = 'Save new password'
  if (isSubmitting) {
    buttonLabel = 'Saving...'
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Choose a new password</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
          <small className="auth-hint">At least {MIN_PASSWORD_LENGTH} characters</small>
        </label>
        <label className="auth-field">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error !== '' && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
          {buttonLabel}
        </button>
      </form>
    </div>
  )
}
