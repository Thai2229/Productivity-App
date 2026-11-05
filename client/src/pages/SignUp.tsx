import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Turnstile from '../components/Turnstile'
import GoogleButton from '../components/GoogleButton'
import { authClient } from '../lib/auth-client'
import LegalLinks from '../components/LegalLinks'

const MIN_PASSWORD_LENGTH = 8

// Cloudflare Turnstile site key (public). If it isn't set, the form works without the check.
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

export default function SignUp() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // True when the email already has an account, so we can link to Log in
  const [emailTaken, setEmailTaken] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  // Changing this redraws the check, since each pass can only be used once
  const [captchaRound, setCaptchaRound] = useState(0)

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
    setEmailTaken(false)
    setIsSubmitting(true)
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password: password,
        fetchOptions: { headers: { 'x-captcha-response': captchaToken } },
      })
      if (result.error) {
        let message = result.error.message || 'Could not create your account. Try again.'
        if (result.error.status === 403 || (result.error.code ?? '').includes('CAPTCHA')) {
          message = "The bot check didn't go through. Please complete it again."
        }
        if (result.error.code === 'USER_ALREADY_EXISTS') {
          message = ''
          setEmailTaken(true)
        }
        setError(message)
        setCaptchaToken('')
        setCaptchaRound((round) => round + 1)
        return
      }
      // The account isn't usable until the email is confirmed with the code we just sent
      navigate('/verify-email?email=' + encodeURIComponent(email.trim()))
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
      <GoogleButton />
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
        {TURNSTILE_SITE_KEY && (
          <Turnstile key={captchaRound} siteKey={TURNSTILE_SITE_KEY} onToken={setCaptchaToken} />
        )}
        {error !== '' && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {emailTaken && (
          <p className="auth-error" role="alert">
            An account with this email already exists. <Link to="/login">Log in instead</Link>
          </p>
        )}
        <button
          className="btn btn-primary auth-submit"
          type="submit"
          disabled={isSubmitting || (Boolean(TURNSTILE_SITE_KEY) && captchaToken === '')}
        >
          {buttonLabel}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
      <LegalLinks forSignUp />
    </div>
  )
}