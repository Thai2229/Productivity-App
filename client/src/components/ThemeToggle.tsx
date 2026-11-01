import { useState } from 'react'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    return 'dark'
  }
  return 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  function handleToggle() {
    let nextTheme: Theme = 'dark'
    if (theme === 'dark') {
      nextTheme = 'light'
    }

    document.documentElement.setAttribute('data-theme', nextTheme)
    try {
      localStorage.setItem('theme', nextTheme)
    } catch {
      // storage is unavailable, so the choice just won't be remembered
    }
    setTheme(nextTheme)
  }

  return (
    <button
      className="theme-toggle"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Dark mode"
      onClick={handleToggle}
    >
      <span className="theme-label">Dark mode</span>
      <span className="theme-track">
        <span className="theme-thumb" />
      </span>
    </button>
  )
}