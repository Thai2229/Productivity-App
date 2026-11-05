import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

const CODE_LENGTH = 6
const RESEND_WAIT_SECONDS = 60

// "Enter the 6-digit code we sent you". People land here after signing up with a password,
// or after logging in before they've confirmed their email.
export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const email = (searchParams.get('email') || '').trim()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  // A code was just sent, so make people wait a minute before asking for another
  const [secondsLeft, setSecondsLeft] = useState(RESEND_WAIT_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) {
      return
    }
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  if (email === '') {
    return <Navigate to="/signup" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (code.length !== CODE_LENGTH) {
      setError('Enter the ' + CODE_LENGTH + '-digit code from the email.')
      return
    }

    setError('')
    setNotice('')
    setIsSubmitting(true)
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp: code })
      if (result.error) {
        const errorCode = result.error.code || ''
        if (errorCode === 'OTP_EXPIRED') {
          setError('That code has expired. Send a new one below.')
        } else if (errorCode === 'TOO_MANY_ATTEMPTS') {
          setError('Too many wrong tries. Send a new code below.')
        } else if (result.error.status === 429) {
          setError('Too many tries. Wait a minute and try again.')
        } else {
          setError("That code isn't right. Check the email and try again.")
        }
        setCode('')
        return
      }
      // The right code also logs you in, so load the app fresh with the new login
      window.location.assign('/pomodoro')
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    setError('')
    setNotice('')
    setIsResending(true)
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' })
      if (result.error) {
        if (result.error.status === 429) {
          setError('Too many requests. Wait a minute and try again.')
        } else {
          setError('Could not send a new code. Try again later.')
        }
        return
      }
      setCode('')
      setNotice('New code sent. Codes from earlier emails no longer work.')
      setSecondsLeft(RESEND_WAIT_SECONDS)
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setIsResending(false)
    }
  }

  let buttonLabel = 'Verify'
  if (isSubmitting) {
    buttonLabel = 'Checking...'
  }

  let resendLabel = 'Send a new code'
  if (isResending) {
    resendLabel = 'Sending...'
  } else if (secondsLeft > 0) {
    resendLabel = 'Send a new code in ' + secondsLeft + 's'
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Check your email</h1>
      <p className="auth-text">
        We sent a {CODE_LENGTH}-digit code to <strong>{email}</strong>. Enter it below to confirm your email. It
        expires in 10 minutes.
      </p>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field">
          <span>Verification code</span>
          <input
            className="auth-code-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            autoFocus
          />
        </label>
        {error !== '' && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {notice !== '' && (
          <p className="auth-notice" role="status">
            {notice}
          </p>
        )}
        <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
          {buttonLabel}
        </button>
      </form>
      <p className="auth-switch">
        No email? Check spam, or{' '}
        <button
          type="button"
          className="auth-text-button"
          onClick={handleResend}
          disabled={isResending || secondsLeft > 0}
        >
          {resendLabel}
        </button>
      </p>
      <p className="auth-switch">
        Wrong email? <Link to="/signup">Sign up again</Link>
      </p>
    </div>
  )
}
