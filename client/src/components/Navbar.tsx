import { NavLink } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import ProfileMenu from './ProfileMenu'
import ThemeToggle from './ThemeToggle'

function getLinkClass({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return 'nav-link active'
  }
  return 'nav-link'
}

// Logged out: log in / sign up links and the dark mode switch.
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
        <ThemeToggle />
      </>
    )
  }

  return <ProfileMenu name={session.user.name} email={session.user.email} />
}

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/pomodoro" className={getLinkClass}>Pomodoro</NavLink>
      <NavLink to="/internships" className={getLinkClass}>Jobs</NavLink>
      <NavLink to="/habits" className={getLinkClass}>Habits</NavLink>
      <NavLink to="/roadmap" className={getLinkClass}>Roadmap</NavLink>
      <div className="nav-actions">
        <AuthControls />
      </div>
    </nav>
  )
}