import { useEffect, useState } from 'react'
import FlowChart from './FlowChart'
import { CheckIcon, FireIcon, TargetIcon } from './HabitIcons'
import TimerRing from './TimerRing'
import { daysText, recentDays, streakFor } from '../lib/habits'
import { SAMPLE_HABITS, SAMPLE_INTERNSHIPS } from '../lib/landing-samples'
import '../habits.css'

// Small, made-up versions of each page for the landing page. Nothing here is saved.

type PreviewPhase = 'work' | 'break' | 'longBreak'

const PREVIEW_PHASES: { value: PreviewPhase; label: string; seconds: number }[] = [
  { value: 'work', label: 'Focus', seconds: 25 * 60 },
  { value: 'break', label: 'Short break', seconds: 5 * 60 },
  { value: 'longBreak', label: 'Long break', seconds: 30 * 60 },
]
const PREVIEW_SESSIONS = 4

function previewSeconds(phase: PreviewPhase) {
  const found = PREVIEW_PHASES.find((item) => item.value === phase)
  if (found) {
    return found.seconds
  }
  return 25 * 60
}

function previewTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
}

function previewCaption(phase: PreviewPhase, completed: number) {
  if (phase === 'work') {
    return 'Session ' + ((completed % PREVIEW_SESSIONS) + 1) + ' of ' + PREVIEW_SESSIONS
  }
  return 'Step away for ' + previewSeconds(phase) / 60 + ' minutes'
}

// A live timer that counts down on its own, starting partway through session 2
export function PomodoroPreview() {
  const [phase, setPhase] = useState<PreviewPhase>('work')
  const [completed, setCompleted] = useState(1)
  const [secondsLeft, setSecondsLeft] = useState(15 * 60 + 30)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => current - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // When the clock runs out, move on to the next phase like the real timer does
  useEffect(() => {
    if (secondsLeft > 0) {
      return
    }

    let nextPhase: PreviewPhase = 'work'
    let nextCompleted = completed
    if (phase === 'work') {
      nextCompleted = completed + 1
      nextPhase = 'break'
      if (nextCompleted % PREVIEW_SESSIONS === 0) {
        nextPhase = 'longBreak'
      }
    }

    setPhase(nextPhase)
    setCompleted(nextCompleted)
    setSecondsLeft(previewSeconds(nextPhase))
  }, [secondsLeft, phase, completed])

  let filledDots = completed % PREVIEW_SESSIONS
  if (phase === 'longBreak') {
    filledDots = PREVIEW_SESSIONS
  }

  return (
    <div className={'timer-card preview-timer timer-' + phase}>
      <div className="phase-tabs">
        {PREVIEW_PHASES.map((item) => {
          let phaseClass = 'phase'
          if (item.value === phase) {
            phaseClass = 'phase phase-active'
          }
          return (
            <span key={item.value} className={phaseClass}>
              {item.label}
            </span>
          )
        })}
      </div>
      <TimerRing
        progress={Math.max(secondsLeft, 0) / previewSeconds(phase)}
        timeText={previewTime(Math.max(secondsLeft, 0))}
        label={previewCaption(phase, completed)}
      />
      <div className="session-dots">
        {Array.from({ length: PREVIEW_SESSIONS }, (_, index) => {
          let dotClass = 'dot'
          if (index < filledDots) {
            dotClass = 'dot dot-done'
          }
          return <span key={index} className={dotClass} />
        })}
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
