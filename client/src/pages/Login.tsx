import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import GoogleButton from '../components/GoogleButton'
import { authClient } from '../lib/auth-client'
import LegalLinks from '../components/LegalLinks'

export default function Login() {
  const { data: session, isPending } = authClient.useSession()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Google sends people back here with ?error=... if sign-in didn't work
  const [error, setError] = useState(() => {
    if (searchParams.get('error')) {
      return "Google sign-in didn't work. Try again, or log in with your email."
    }
    return ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  let destination = '/pomodoro'
  const state = location.state as { from?: string } | null
  if (state && state.from) {
    destination = state.from
  }

  if (!isPending && session) {
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (email.trim() === '' || password === '') {
      setError('Enter your email and password.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password: password,
      })
      if (result.error) {
        setError(result.error.message || 'Could not log in. Try again.')
      }
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  let buttonLabel = 'Log in'
  if (isSubmitting) {
    buttonLabel = 'Logging in...'
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Log in</h1>
      <GoogleButton />
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
        <label className="auth-field">
          <span className="auth-label-row">
            Password
            <Link className="auth-forgot" to="/forgot-password">
              Forgot password?
            </Link>
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
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
        No account yet? <Link to="/signup">Sign up</Link>
      </p>
      <LegalLinks />
    </div>
  )
}