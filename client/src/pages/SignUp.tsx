import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

const MIN_PASSWORD_LENGTH = 8

export default function SignUp() {
  const { data: session, isPending } = authClient.useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isPending && session) {
    return <Navigate to="/pomodoro" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (name.trim() === '' || email.trim() === '' || password.length < MIN_PASSWORD_LENGTH) {
      setError(
        'Enter your name, your email, and a password of at least ' +
          MIN_PASSWORD_LENGTH +
          ' characters.',
      )
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password: password,
      })
      if (result.error) {
        setError(result.error.message || 'Could not create your account. Try again.')
      }
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  let buttonLabel = 'Create account'
  if (isSubmitting) {
    buttonLabel = 'Creating account...'
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Create an account</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
          <small className="auth-hint">At least {MIN_PASSWORD_LENGTH} characters</small>
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
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}