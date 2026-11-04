import { useState } from 'react'
import { CheckBadgeIcon, CheckIcon, FireIcon, PercentIcon, TargetIcon } from './HabitIcons'
import { dayKey, daysText, monthGrid, monthStats, streakFor, type Habit } from '../lib/habits'

type Props = {
  habit: Habit
  onToggle: (habit: Habit, day: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

  const monthTitle = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <aside className="habit-detail" aria-label={habit.name + ' details'}>
      <div className="detail-header">
        <span className="habit-icon" aria-hidden="true">{habit.icon}</span>
        <h2 className="detail-title">{habit.name}</h2>
      </div>

      <dl className="detail-stats">
        <div className="detail-stat">
          <dt><CheckBadgeIcon /> Monthly check-ins</dt>
          <dd>{stats.checkIns} <span>{daysText(stats.checkIns).replace(/^\d+ /, '')}</span></dd>
        </div>
        <div className="detail-stat">
          <dt><TargetIcon /> Total check-ins</dt>
          <dd>{habit.checks.length} <span>{daysText(habit.checks.length).replace(/^\d+ /, '')}</span></dd>
        </div>
        <div className="detail-stat">
          <dt><PercentIcon /> Monthly check-in rate</dt>
          <dd>{rateText} {stats.rate !== null && <span>%</span>}</dd>
        </div>
        <div className={streakClass}>
          <dt><FireIcon lit={streak > 0} /> Current streak</dt>
          <dd>{streak} <span>{daysText(streak).replace(/^\d+ /, '')}</span></dd>
        </div>
      </dl>

      <div className="calendar">
        <div className="calendar-nav">
          <button type="button" className="calendar-arrow" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>
          </button>
          <h3 className="calendar-title">{monthTitle}</h3>
          <button
            type="button"
            className="calendar-arrow"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            disabled={isCurrentMonth}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
          </button>
        </div>

        <div className="calendar-grid">
          {WEEKDAYS.map((name) => (
            <span key={name} className="calendar-weekday">{name}</span>
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
            let dotClass = 'day-dot calendar-dot'
            if (checked) {
              dotClass = dotClass + ' day-dot-done'
            }
            return (
              <div key={cell.key} className={className}>
                <span className="calendar-number">{cell.number}</span>
                <button
                  type="button"
                  className={dotClass}
                  aria-pressed={checked}
                  aria-label={habit.name + ' on ' + cell.key}
                  disabled={future || !cell.inMonth}
                  onClick={() => onToggle(habit, cell.key)}
                >
                  {checked && <CheckIcon />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
