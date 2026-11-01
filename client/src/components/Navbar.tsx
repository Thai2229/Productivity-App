import { NavLink } from 'react-router-dom'

function getLinkClass({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return 'nav-link active'
  }
  return 'nav-link'
}

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/pomodoro" className={getLinkClass}>Pomodoro</NavLink>
      <NavLink to="/internships" className={getLinkClass}>Internships</NavLink>
      <NavLink to="/habits" className={getLinkClass}>Habits</NavLink>
      <NavLink to="/roadmap" className={getLinkClass}>Roadmap</NavLink>
    </nav>
  )
}