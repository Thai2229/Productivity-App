import { useEffect, useState, type FormEvent } from 'react'
import {
  HABIT_ICONS,
  createHabit,
  daysText,
  deleteHabit,
  listHabits,
  recentDays,
  setCheck,
  streakFor,
  updateHabit,
  type Habit,
  type HabitDraft,
} from '../lib/habits'
import HabitDetail from '../components/HabitDetail'
import { CheckIcon, FireIcon, TargetIcon } from '../components/HabitIcons'
import '../habits.css'

type LoadState = 'loading' | 'ready' | 'error'

type FormProps = {
  initial: Habit | null
  onSave: (draft: HabitDraft) => Promise<void>
  onDelete: () => Promise<void>
  onCancel: () => void
}

function HabitForm({ initial, onSave, onDelete, onCancel }: FormProps) {
  let startName = ''
  let startIcon = HABIT_ICONS[0]
  if (initial) {
    startName = initial.name
    startIcon = initial.icon
  }
  const [name, setName] = useState(startName)
  const [icon, setIcon] = useState(startIcon)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  let title = 'Add habit'
  let submitText = 'Add habit'
  if (initial) {
    title = 'Edit habit'
    submitText = 'Save changes'
  }
  if (saving) {
    submitText = 'Saving…'
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (name.trim() === '') {
      setError('Give the habit a name.')
      return
    }
    setSaving(true)
    try {
      await onSave({ name, icon })
    } catch (saveError) {
      setError((saveError as Error).message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    setError('')
    try {
      await onDelete()
    } catch (deleteError) {
      setError((deleteError as Error).message)
    }
  }

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <h2 className="habit-form-title">{title}</h2>

      <label className="auth-field">
        <span>Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoFocus required />
      </label>

      <div className="auth-field">
        <span>Icon</span>
        <div className="icon-picker" role="group" aria-label="Icon">
          {HABIT_ICONS.map((choice) => (
            <button
              key={choice}
              type="button"
              className="icon-choice"
              aria-pressed={icon === choice}
              onClick={() => setIcon(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="habit-form-actions">
        {initial && !confirming && (
          <button type="button" className="link-btn link-btn-danger" onClick={() => setConfirming(true)}>
            Delete habit
          </button>
        )}
        {initial && confirming && (
          <span className="habit-confirm">
            Delete it and all its check-ins?
            <button type="button" className="link-btn link-btn-danger" onClick={handleDelete}>
              Yes, delete
            </button>
            <button type="button" className="link-btn" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </span>
        )}
        <span className="habit-form-spacer" />
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {submitText}
        </button>
      </div>
    </form>
  )
}

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [actionError, setActionError] = useState('')
  const [selectedId, setSelectedId] = useState('')

  async function load() {
    try {
      setHabits(await listHabits())
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading data once when the page opens
    load()
  }, [])

  function retry() {
    setLoadState('loading')
    load()
  }

  function replaceHabit(updated: Habit) {
    setHabits((rows) => rows.map((row) => {
      if (row.id === updated.id) {
        return updated
      }
      return row
    }))
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
    setActionError('')
  }

  function openEdit(habit: Habit) {
    setEditing(habit)
    setFormOpen(true)
    setActionError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSave(draft: HabitDraft) {
    if (editing) {
      replaceHabit(await updateHabit(editing.id, draft))
    } else {
      const saved = await createHabit(draft)
      setHabits((rows) => [...rows, saved])
    }
    closeForm()
  }

  async function handleDelete() {
    if (!editing) {
      return
    }
    await deleteHabit(editing.id)
    const removedId = editing.id
    setHabits((rows) => rows.filter((row) => row.id !== removedId))
    closeForm()
  }

  // Updates the screen straight away, then saves; puts it back if saving fails
  async function toggleDay(habit: Habit, day: string) {
    setActionError('')
    const done = !habit.checks.includes(day)
    let checks = habit.checks.filter((item) => item !== day)
    if (done) {
      checks = [...habit.checks, day].sort()
    }
    replaceHabit({ ...habit, checks })
    try {
      await setCheck(habit.id, day, done)
    } catch (error) {
      replaceHabit(habit)
      setActionError('Could not save that day: ' + (error as Error).message)
    }
  }

  if (loadState === 'loading') {
    return <p className="auth-loading">Loading your habits…</p>
  }

  if (loadState === 'error') {
    return (
      <div className="habits tracker-empty">
        <p>Couldn't load your habits. Check your connection and try again.</p>
        <button type="button" className="btn btn-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    )
  }

  const days = recentDays(7)

  // The habit shown in the side panel: the one clicked, or the first one
  let selected: Habit | null = null
  for (const habit of habits) {
    if (habit.id === selectedId) {
      selected = habit
    }
  }
  if (!selected && habits.length > 0) {
    selected = habits[0]
  }

  return (
    <div className="habits">
      <header className="tracker-header">
        <div>
          <h1 className="tracker-title">Daily Habits</h1>
          <p className="tracker-subtitle">Tap a circle to log that day</p>
        </div>
        {!formOpen && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            Add habit
          </button>
        )}
      </header>

      {formOpen && (
        <HabitForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={closeForm}
        />
      )}

      {actionError && <p className="auth-error" role="alert">{actionError}</p>}

      {habits.length === 0 && !formOpen && (
        <div className="tracker-empty">
          <p>No habits yet. Add one you want to do every day.</p>
        </div>
      )}

      {habits.length > 0 && selected && (
        <div className="habit-layout">
          <div className="habit-list">
            <div className="habit-days-header" aria-hidden="true">
              {days.map((day) => {
                let className = 'day-label'
                if (day.isToday) {
                  className = 'day-label day-label-today'
                }
                return (
                  <span key={day.key} className={className}>
                    <span>{day.letter}</span>
                    <span className="day-number">{day.number}</span>
                  </span>
                )
              })}
            </div>

            <ul className="habit-rows">
              {habits.map((habit) => {
                const streak = streakFor(habit.checks)
                let streakClass = 'habit-meta-item'
                if (streak === 0) {
                  streakClass = 'habit-meta-item habit-meta-dull'
                }

                let rowClass = 'habit-row'
                if (selected && habit.id === selected.id) {
                  rowClass = 'habit-row habit-row-selected'
                }

                return (
                  <li key={habit.id} className={rowClass}>
                    <button
                      type="button"
                      className="habit-select"
                      onClick={() => setSelectedId(habit.id)}
                      aria-label={'Show details for ' + habit.name}
                    >
                      <span className="habit-icon" aria-hidden="true">{habit.icon}</span>
                    </button>

                    <div className="habit-info">
                      <div className="habit-name-line">
                        <button type="button" className="habit-name" onClick={() => setSelectedId(habit.id)}>
                          {habit.name}
                        </button>
                        <button
                          type="button"
                          className="habit-edit"
                          onClick={() => openEdit(habit)}
                          aria-label={'Edit ' + habit.name}
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M10.5 2.8l2.7 2.7-7.6 7.6H2.9v-2.7z" />
                          </svg>
                        </button>
                      </div>
                      <p className="habit-meta">
                        <span className="habit-meta-item" data-tooltip="Total check-ins">
                          <TargetIcon />
                          {daysText(habit.checks.length)}
                        </span>
                        <span className={streakClass} data-tooltip="Total streak">
                          <FireIcon lit={streak > 0} />
                          {daysText(streak)}
                        </span>
                      </p>
                    </div>

                    <div className="habit-days">
                      {days.map((day) => {
                        const done = habit.checks.includes(day.key)
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
                            onClick={() => toggleDay(habit, day.key)}
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

          <HabitDetail key={selected.id} habit={selected} onToggle={toggleDay} />
          </div>
      )}
    </div>
  )
}
