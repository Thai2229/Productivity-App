import type { ReactNode } from 'react'

// Small icons shared by the habit list, the habit detail panel and the landing preview

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

export function CheckIcon() {
  return (
    <svg className="day-check" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 8.4l2.6 2.6L12 5.6" />
    </svg>
  )
}

// The stored icon values are emoji; they are shown as simple line icons (24px grid, stroke 1.5)
const GLYPHS: Record<string, ReactNode> = {
  '📘': <path d="M6 3.5h12a1 1 0 0 1 1 1V20H7a1 1 0 0 1-1-1zM6 17h13" />,
  '💪': <path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12" />,
  '💧': <path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5z" />,
  '🏃': (
    <>
      <circle cx="14.5" cy="5" r="1.6" />
      <path d="M12.5 8.5l-2 5M8 10.5l4.5-2 3 2.5M10.5 13.5L8 19M10.5 13.5l3.5 2 1 3.5" />
    </>
  ),
  '🧘': (
    <>
      <circle cx="12" cy="6" r="2" />
      <path d="M4.5 18.5c2.5 0 4-1.5 4.5-4h6c.5 2.5 2 4 4.5 4M9 14.5l3-3.5 3 3.5" />
    </>
  ),
  '😴': <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
  '🥗': <path d="M4 11h16a8 8 0 0 1-16 0zM9 11c0-3 1.5-5 4-6M14 11c0-2 1-3.5 3-4.5" />,
  '💻': (
    <>
      <rect x="4.5" y="5" width="15" height="10" rx="1" />
      <path d="M2.5 19h19" />
    </>
  ),
  '✍️': <path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19zM14.5 6.5l3 3" />,
  '🎸': (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
    </>
  ),
  '🧹': <path d="M15.5 3.5L11 12M7 12h8.5l2 8h-13zM10 16v4M13 16v4" />,
  '💊': (
    <g transform="rotate(-45 12 12)">
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" />
      <path d="M12 8.5v7" />
    </g>
  ),
}

export function HabitIcon({ value }: { value: string }) {
  let glyph = GLYPHS[value]
  if (!glyph) {
    glyph = <circle cx="12" cy="12" r="7" />
  }
  return (
    <svg className="habit-glyph" viewBox="0 0 24 24" aria-hidden="true">
      {glyph}
    </svg>
  )
}
