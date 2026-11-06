import type { CSSProperties } from 'react'

// The landing page's "hand of cards": one card per part of the app.
// Hovering, focusing or tapping a card lifts it out of the hand and picks it.

export type AppCardId = 'pomodoro' | 'todos' | 'calendar' | 'jobs' | 'habits' | 'roadmap'

export type AppCard = {
  id: AppCardId
  name: string
  label: string
  blurb: string
  color: string
  color2: string
  image: string
}

export const APP_CARDS: AppCard[] = [
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    label: 'Focus',
    blurb: 'Focus in 25-minute sprints with breaks built in.',
    color: '#ef5b4c',
    color2: '#f59e0b',
    image: '/cards/pomodoro.webp',
  },
  {
    id: 'todos',
    name: 'To-Do',
    label: 'Tasks',
    blurb: 'Tasks with due dates. Tick them off, bring them back.',
    color: '#3b82f6',
    color2: '#06b6d4',
    image: '/cards/todos.webp',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    label: 'Schedule',
    blurb: 'A simple month view for the things coming up.',
    color: '#14b8a6',
    color2: '#22c55e',
    image: '/cards/calendar.webp',
  },
  {
    id: 'jobs',
    name: 'Jobs',
    label: 'Career',
    blurb: 'Track every application and see where they go.',
    color: '#6366f1',
    color2: '#a855f7',
    image: '/cards/jobs.webp',
  },
  {
    id: 'habits',
    name: 'Habits',
    label: 'Routine',
    blurb: 'Daily check-ins and streaks that keep you going.',
    color: '#f59e0b',
    color2: '#f97316',
    image: '/cards/habits.webp',
  },
  {
    id: 'roadmap',
    name: 'Roadmap',
    label: 'Learning',
    blurb: 'Map the skills you know and the ones to learn next.',
    color: '#a855f7',
    color2: '#ec4899',
    image: '/cards/roadmap.webp',
  },
]

type Props = {
  active: AppCardId
  hovered: AppCardId | null
  onHover: (id: AppCardId | null) => void
  onPick: (id: AppCardId) => void
}

// Where each card sits in the fanned-out hand. The lifted card straightens and grows,
// and its neighbours lean away a little to make room.
// The gap between cards is --fan-step in landing.css, so the hand narrows on smaller screens.
function fanStyle(index: number, count: number, liftedIndex: number, isActive: boolean) {
  const middle = (count - 1) / 2
  const offset = index - middle
  let shift = 0
  let y = offset * offset * 0.55
  let rotate = offset * 7
  let scale = 1

  if (liftedIndex !== -1 && index !== liftedIndex) {
    if (index < liftedIndex) {
      shift = -1.8
    } else {
      shift = 1.8
    }
  }
  if (index === liftedIndex) {
    y -= 3
    rotate = 0
    scale = 1.1
  } else if (isActive && liftedIndex === -1) {
    y -= 1.25
  }

  let zIndex = index + 1
  if (index === liftedIndex) {
    zIndex = 20
  }

  const x = 'calc(var(--fan-step) * ' + offset + ' + ' + shift + 'rem)'
  return {
    transform: 'translateX(' + x + ') translateY(' + y + 'rem) rotate(' + rotate + 'deg) scale(' + scale + ')',
    zIndex,
  }
}

export default function AppCards({ active, hovered, onHover, onPick }: Props) {
  const liftedIndex = APP_CARDS.findIndex((card) => card.id === hovered)

  return (
    <div className="app-cards" role="group" aria-label="Parts of the app" onMouseLeave={() => onHover(null)}>
      {APP_CARDS.map((card, index) => {
        const isActive = card.id === active
        let cardClass = 'app-card'
        if (isActive) {
          cardClass += ' app-card-active'
        }
        if (index === liftedIndex) {
          cardClass += ' app-card-lifted'
        }
        const style = fanStyle(index, APP_CARDS.length, liftedIndex, isActive) as CSSProperties & Record<string, string | number>
        style['--card-color'] = card.color
        style['--card-color-2'] = card.color2
        let action = 'Preview'
        if (isActive) {
          action = 'Previewing'
        }
        return (
          <button
            key={card.id}
            type="button"
            className={cardClass}
            style={style}
            aria-pressed={isActive}
            onMouseEnter={() => onHover(card.id)}
            onFocus={() => onHover(card.id)}
            onBlur={() => onHover(null)}
            onClick={() => onPick(card.id)}
          >
            <span className="app-card-media" aria-hidden="true">
              <img className="app-card-image" src={card.image} alt="" width={640} height={400} loading="lazy" draggable={false} />
            </span>
            <span className="app-card-body">
              <span className="app-card-label">{card.label}</span>
              <span className="app-card-name">{card.name}</span>
              <span className="app-card-blurb">{card.blurb}</span>
            </span>
            <span className="app-card-action" aria-hidden="true">
              {action}
            </span>
          </button>
        )
      })}
    </div>
  )
}
