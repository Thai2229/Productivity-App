import { NavLink, useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import ThemeToggle from './ThemeToggle'

function getLinkClass({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return 'nav-link active'
  }
  return 'nav-link'
}

function AuthControls() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  async function handleLogout() {
    await authClient.signOut()
    navigate('/pomodoro')
  }

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

  return (
    <>
      <span className="nav-user">{session.user.email}</span>
      <button className="nav-logout" onClick={handleLogout}>Log out</button>
    </>
  )
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
        <ThemeToggle />
      </div>
    </nav>
  )
}