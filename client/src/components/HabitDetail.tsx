import { useState } from 'react'
import { HabitIcon } from './HabitIcons'
import { dayKey, monthGrid, monthStats, streakFor, type Habit } from '../lib/habits'

type Props = {
  habit: Habit
  onToggle: (habit: Habit, day: string) => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function HabitDetail({ habit, onToggle }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const today = dayKey(now)
  const stats = monthStats(habit, year, month)
  const streak = streakFor(habit.checks)
  const done = new Set(habit.checks)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  let rateText = '—'
  if (stats.rate !== null) {
    rateText = String(Math.round(stats.rate * 100))
  }

  let streakClass = 'detail-stat'
  if (streak === 0) {
    streakClass = 'detail-stat detail-stat-dull'
  }

  let streakUnit = ' days'
  if (streak === 1) {
    streakUnit = ' day'
  }

  const monthTitle = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <aside className="habit-detail" aria-label={habit.name + ' details'}>
      <div className="detail-header">
        <span className="habit-icon" aria-hidden="true"><HabitIcon value={habit.icon} /></span>
        <h2 className="detail-title">{habit.name}</h2>
      </div>

      <dl className="detail-stats">
        <div className="detail-stat">
          <dt>Check-ins this month</dt>
          <dd>{stats.checkIns}</dd>
        </div>
        <div className="detail-stat">
          <dt>Check-ins total</dt>
          <dd>{habit.checks.length}</dd>
        </div>
        <div className="detail-stat">
          <dt>Monthly rate</dt>
          <dd>{rateText}{stats.rate !== null && <span>%</span>}</dd>
        </div>
        <div className={streakClass}>
          <dt>Current streak</dt>
          <dd>{streak}<span>{streakUnit}</span></dd>
        </div>
      </dl>

      <div className="calendar">
        <div className="calendar-nav">
          <h3 className="calendar-title">{monthTitle}</h3>
          <div className="calendar-arrows">
            <button type="button" className="btn btn-icon btn-small" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>
            </button>
            <button
              type="button"
              className="btn btn-icon btn-small"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              disabled={isCurrentMonth}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          {WEEKDAYS.map((name, index) => (
            <span key={index} className="calendar-weekday"><abbr title={WEEKDAY_NAMES[index]}>{name}</abbr></span>
          ))}
          {monthGrid(year, month).map((cell) => {
            const checked = done.has(cell.key)
            const future = cell.key > today
            let className = 'calendar-day'
            if (!cell.inMonth) {
              className = className + ' calendar-day-outside'
            }
            if (cell.key === today) {
              className = className + ' calendar-day-today'
            }
            if (checked) {
              className = className + ' calendar-day-done'
            }
            return (
              <button
                key={cell.key}
                type="button"
                className={className}
                aria-pressed={checked}
                aria-label={habit.name + ' on ' + cell.key}
                disabled={future || !cell.inMonth}
                onClick={() => onToggle(habit, cell.key)}
              >
                {cell.number}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
