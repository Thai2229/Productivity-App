import { NavLink } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import ProfileMenu from './ProfileMenu'

function getLinkClass({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return 'nav-link active'
  }
  return 'nav-link'
}

// Logged out: log in / sign up links.
// Logged in: the profile letter (dark mode lives in Settings → Appearance).
function AuthControls() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return null
  }

  if (!session) {
    return (
      <>
        <NavLink to="/login" className={getLinkClass}>Log in</NavLink>
        <NavLink to="/signup" className={getLinkClass}>Sign up</NavLink>
      </>
    )
  }

  return <ProfileMenu name={session.user.name} email={session.user.email} />
}

export default function Navbar() {
  const { data: session } = authClient.useSession()

  return (
    <nav className="navbar">
      {!session && (
        <NavLink to="/" className="nav-brand">
          Productivity App
        </NavLink>
      )}
      {session && (
        <div className="nav-links">
          <NavLink to="/pomodoro" className={getLinkClass}>Pomodoro</NavLink>
          <NavLink to="/todos" className={getLinkClass}>To-Do</NavLink>
          <NavLink to="/calendar" className={getLinkClass}>Calendar</NavLink>
          <NavLink to="/internships" className={getLinkClass}>Jobs</NavLink>
          <NavLink to="/habits" className={getLinkClass}>Habits</NavLink>
          <NavLink to="/roadmap" className={getLinkClass}>Roadmap</NavLink>
        </div>
      )}
      <div className="nav-actions">
        <AuthControls />
      </div>
    </nav>
  )
}