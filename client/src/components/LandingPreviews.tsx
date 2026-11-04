import { useState } from 'react'
import FlowChart from './FlowChart'
import { CheckIcon, FireIcon, TargetIcon } from './HabitIcons'
import TimerRing from './TimerRing'
import { daysText, recentDays, streakFor } from '../lib/habits'
import { SAMPLE_HABITS, SAMPLE_INTERNSHIPS } from '../lib/landing-samples'
import '../habits.css'

// Small, made-up versions of each page for the landing page. Nothing here is saved.

export function PomodoroPreview() {
  return (
    <div className="timer-card preview-timer">
      <div className="phase-tabs">
        <span className="phase phase-active">Focus</span>
        <span className="phase">Short break</span>
        <span className="phase">Long break</span>
      </div>
      <TimerRing progress={0.62} timeText="15:30" label="Session 2 of 4" />
      <div className="session-dots">
        <span className="dot dot-done" />
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  )
}

export function JobsPreview() {
  return <FlowChart internships={SAMPLE_INTERNSHIPS} />
}

// Visitors can tap the circles; it only changes what's on their screen
export function HabitsPreview() {
  const days = recentDays(7)
  const [checked, setChecked] = useState(() =>
    SAMPLE_HABITS.map((habit) => habit.done.map((index) => days[index].key)),
  )

  function toggle(row: number, key: string) {
    setChecked((current) => current.map((keys, index) => {
      if (index !== row) {
        return keys
      }
      if (keys.includes(key)) {
        return keys.filter((item) => item !== key)
      }
      return [...keys, key].sort()
    }))
  }

  return (
    <div className="habits-preview">
      <ul className="habit-rows">
        {SAMPLE_HABITS.map((habit, row) => {
          const keys = checked[row]
          const streak = streakFor(keys)
          let streakClass = 'habit-meta-item'
          if (streak === 0) {
            streakClass = 'habit-meta-item habit-meta-dull'
          }
          const total = habit.total - habit.done.length + keys.length
          return (
            <li key={habit.id} className="habit-row">
              <span className="habit-icon" aria-hidden="true">{habit.icon}</span>
              <div className="habit-info">
                <p className="habit-name preview-habit-name">{habit.name}</p>
                <p className="habit-meta">
                  <span className="habit-meta-item">
                    <TargetIcon />
                    {daysText(total)}
                  </span>
                  <span className={streakClass}>
                    <FireIcon lit={streak > 0} />
                    {daysText(streak)}
                  </span>
                </p>
              </div>
              <div className="habit-days">
                {days.map((day) => {
                  const done = keys.includes(day.key)
                  let className = 'day-dot'
                  if (done) {
                    className = 'day-dot day-dot-done'
                  }
                  if (day.isToday) {
                    className = className + ' day-dot-today'
                  }
                  return (
                    <button
                      key={day.key}
                      type="button"
                      className={className}
                      aria-pressed={done}
                      aria-label={habit.name + ' on ' + day.key}
                      onClick={() => toggle(row, day.key)}
                    >
                      {done && <CheckIcon />}
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
