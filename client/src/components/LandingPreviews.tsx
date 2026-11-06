import { useEffect, useState } from 'react'
import FlowChart from './FlowChart'
import { CheckIcon, FireIcon, TargetIcon } from './HabitIcons'
import TimerRing from './TimerRing'
import { dayKey, daysText, monthGrid, recentDays, shiftDay, streakFor } from '../lib/habits'
import { SAMPLE_EVENTS, SAMPLE_HABITS, SAMPLE_INTERNSHIPS, SAMPLE_TODOS } from '../lib/landing-samples'
import { dueLabel } from '../lib/todos'
import '../habits.css'
import '../todos.css'
import '../calendar.css'

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

// Visitors can tick tasks to move them between Current and Past; nothing is saved
export function TodosPreview() {
  const today = dayKey(new Date())
  const [doneIds, setDoneIds] = useState(() => SAMPLE_TODOS.filter((todo) => todo.done).map((todo) => todo.id))

  function toggle(id: string) {
    setDoneIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }
      return [...current, id]
    })
  }

  function renderTask(todo: (typeof SAMPLE_TODOS)[number]) {
    const isPast = doneIds.includes(todo.id)
    let itemClass = 'todo-item'
    let label = 'Mark "' + todo.title + '" as done'
    if (isPast) {
      itemClass = 'todo-item todo-item-past'
      label = 'Move "' + todo.title + '" back to current'
    }
    let badge = null
    if (todo.dueIn !== null) {
      const due = dueLabel(shiftDay(today, todo.dueIn), isPast)
      badge = <span className={'todo-due todo-due-' + due.tone}>{due.text}</span>
    }
    return (
      <li key={todo.id} className={itemClass}>
        <button type="button" className="todo-check" onClick={() => toggle(todo.id)} aria-label={label}>
          {isPast && <CheckIcon />}
        </button>
        <div className="todo-body">
          <div className="todo-title-line">
            <p className="todo-title">{todo.title}</p>
            {badge}
          </div>
          {todo.description !== '' && <p className="todo-description">{todo.description}</p>}
        </div>
      </li>
    )
  }

  const current = SAMPLE_TODOS.filter((todo) => !doneIds.includes(todo.id))
    .sort((a, b) => (a.dueIn ?? 999) - (b.dueIn ?? 999))
  const past = SAMPLE_TODOS.filter((todo) => doneIds.includes(todo.id))

  return (
    <div className="todos-preview todo-columns">
      <section className="todo-column">
        <p className="todo-column-title">
          Current <span className="todo-count">{current.length}</span>
        </p>
        <ul className="todo-list">{current.map(renderTask)}</ul>
      </section>
      <section className="todo-column">
        <p className="todo-column-title">
          Past <span className="todo-count">{past.length}</span>
        </p>
        <ul className="todo-list">{past.map(renderTask)}</ul>
      </section>
    </div>
  )
}

// This month with a few sample events; visitors can click a day to see its events
export function CalendarPreview() {
  const today = dayKey(new Date())
  const now = new Date()
  const [selected, setSelected] = useState(shiftDay(today, 2))
  const cells = monthGrid(now.getFullYear(), now.getMonth())

  const byDay = new Map<string, (typeof SAMPLE_EVENTS)[number][]>()
  for (const event of SAMPLE_EVENTS) {
    const key = shiftDay(today, event.day)
    const list = byDay.get(key) ?? []
    list.push(event)
    byDay.set(key, list)
  }
  const selectedEvents = byDay.get(selected) ?? []
  const monthName = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const weekdays = cells.slice(0, 7).map((cell) =>
    new Date(cell.key + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }),
  )

  return (
    <div className="calendar-preview cal-layout">
      <div className="cal-month">
        <div className="cal-toolbar">
          <p className="cal-month-name">{monthName}</p>
        </div>
        <div className="cal-grid">
          {weekdays.map((name) => (
            <div key={name} className="cal-weekday">
              {name}
            </div>
          ))}
          {cells.map((cell) => {
            const dayEvents = byDay.get(cell.key) ?? []
            let cellClass = 'cal-day'
            if (!cell.inMonth) {
              cellClass += ' cal-day-outside'
            }
            if (cell.key === selected) {
              cellClass += ' cal-day-selected'
            }
            if (cell.key === today) {
              cellClass += ' cal-day-today'
            }
            return (
              <button key={cell.key} type="button" className={cellClass} onClick={() => setSelected(cell.key)} aria-pressed={cell.key === selected}>
                <span className="cal-day-number">{cell.number}</span>
                <span className="cal-chips">
                  {dayEvents.map((event) => (
                    <span key={event.id} className="cal-chip">
                      {event.title}
                    </span>
                  ))}
                </span>
                {dayEvents.length > 0 && <span className="cal-dot" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>
      <div className="cal-panel">
        <p className="cal-panel-title">
          {new Date(selected + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {selectedEvents.length === 0 && <p className="cal-empty">Nothing planned for this day.</p>}
        {selectedEvents.length > 0 && (
          <ul className="cal-events">
            {selectedEvents.map((event) => (
              <li key={event.id} className="cal-event">
                <p className="cal-event-title">{event.title}</p>
                {event.description !== '' && <p className="cal-event-description">{event.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
