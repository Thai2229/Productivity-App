// Small icons shared by the habit list and the habit detail panel

export function TargetIcon() {
  return (
    <svg className="habit-meta-icon habit-target" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" />
      <circle cx="8" cy="8" r="3.5" />
      <circle cx="8" cy="8" r="0.9" className="habit-target-dot" />
    </svg>
  )
}

export function FireIcon({ lit }: { lit: boolean }) {
  let className = 'habit-meta-icon habit-fire'
  if (lit) {
    className = 'habit-meta-icon habit-fire habit-fire-lit'
  }
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8.2 1.5c.4 2.1-.6 3.3-1.7 4.5C5.4 7.2 4.3 8.4 4.3 10.3A3.7 3.7 0 0 0 8 14.5a3.9 3.9 0 0 0 3.9-3.9c0-1.6-.8-2.8-1.6-3.6-.1 1-.6 1.7-1.3 2 .5-2.6-.1-5.6-.8-7.5Z" />
    </svg>
  )
}

export function CheckBadgeIcon() {
  return (
    <svg className="habit-meta-icon habit-badge-check" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" />
      <path d="M5 8.2l2 2 4-4.2" />
    </svg>
  )
}

export function PercentIcon() {
  return (
    <svg className="habit-meta-icon habit-badge-percent" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" />
      <path d="M5.5 10.5l5-5" />
      <circle cx="5.9" cy="5.9" r="0.9" />
      <circle cx="10.1" cy="10.1" r="0.9" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg className="day-check" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 8.4l2.6 2.6L12 5.6" />
    </svg>
  )
}
