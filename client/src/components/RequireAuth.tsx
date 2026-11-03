import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

export default function RequireAuth() {
  const { data: session, isPending } = authClient.useSession()
  const location = useLocation()

  if (isPending) {
    return <p className="auth-loading">Loading...</p>
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}