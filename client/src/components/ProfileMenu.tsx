import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import '../profile.css'

type Props = {
  name: string
  email: string
}

// The round letter at the top right, and the menu that drops down from it
export default function ProfileMenu({ name, email }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close when clicking anywhere else or pressing Escape
  useEffect(() => {
    if (!open) {
      return
    }
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  let initial = name.trim().charAt(0)
  if (initial === '') {
    initial = email.charAt(0)
  }
  initial = initial.toUpperCase()

  let displayName = name.trim()
  if (displayName === '') {
    displayName = email
  }

  async function handleLogout() {
    setOpen(false)
    await authClient.signOut()
    navigate('/pomodoro')
  }

  return (
    <div className="profile" ref={menuRef}>
      <button
        type="button"
        className="avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={'Account menu for ' + displayName}
        onClick={() => setOpen(!open)}
      >
        {initial}
      </button>

      {open && (
        <div className="profile-menu" role="menu">
          <div className="profile-header">
            <span className="avatar avatar-large" aria-hidden="true">{initial}</span>
            <div className="profile-who">
              <span className="profile-name">{displayName}</span>
              <span className="profile-email">{email}</span>
            </div>
          </div>
          <Link to="/settings" role="menuitem" className="profile-item" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="5.5" r="2.75" />
              <path d="M2.75 13.5c.6-2.4 2.7-3.75 5.25-3.75s4.65 1.35 5.25 3.75" />
            </svg>
            Account
          </Link>
          <Link to="/settings?tab=appearance" role="menuitem" className="profile-item" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="5.75" />
              <path d="M8 2.25a5.75 5.75 0 0 0 0 11.5z" className="fill" />
            </svg>
            Appearance
          </Link>
          <div className="profile-divider" />
          <button type="button" role="menuitem" className="profile-item" onClick={handleLogout}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6.5 2.75H3.25v10.5H6.5M10 5l3 3-3 3M13 8H6" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
