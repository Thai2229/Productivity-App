import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

// Asks for an email and sends a reset link. The message afterwards is the same whether
// or not the email has an account, so this page can't be used to find out who's signed up.
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = email.trim()
    if (trimmed === '' || !trimmed.includes('@')) {
      setError('Enter the email you signed up with.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const result = await authClient.requestPasswordReset({
        email: trimmed,
        redirectTo: '/reset-password',
      })
      if (result.error) {
        if (result.error.status === 429) {
          setError('Too many requests. Wait a minute and try again.')
        } else {
          setError('Could not send the email. Try again later.')
        }
        return
      }
      setSentTo(trimmed)
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sentTo !== '') {
    return (
      <div className="auth-card">
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-text">
          If <strong>{sentTo}</strong> has an account, we sent it a link to reset your password. The link expires
          in 1 hour.
        </p>
        <p className="auth-text auth-text-muted">Not there? Check your spam folder.</p>
        <p className="auth-switch">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    )
  }

  let buttonLabel = 'Send reset link'
  if (isSubmitting) {
    buttonLabel = 'Sending...'
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Forgot your password?</h1>
      <p className="auth-text">Enter your email and we'll send you a link to choose a new one.</p>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
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
      <p className="auth-switch">
        Remembered it? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
