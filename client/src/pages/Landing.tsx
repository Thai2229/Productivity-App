import { Navigate } from 'react-router-dom'
import LandingSite from '../components/LandingSite'
import { authClient } from '../lib/auth-client'

export default function Landing() {
  const { data: session, isPending } = authClient.useSession()

  // Logged-in users go straight to the app
  if (isPending) {
    return <p className="auth-loading">Loading…</p>
  }
  if (session) {
    return <Navigate to="/pomodoro" replace />
  }

  return <LandingSite />
}
