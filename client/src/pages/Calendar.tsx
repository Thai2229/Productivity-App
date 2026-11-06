import { useEffect, useState, type FormEvent } from 'react'
import { dayKey, monthGrid } from '../lib/habits'
import {
  MAX_DESCRIPTION,
  MAX_TITLE,
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  type CalendarEvent,
  type EventDraft,
} from '../lib/events'
import '../calendar.css'

type LoadState = 'loading' | 'ready' | 'error'

// A month view shows at most three event titles per day, then "+2 more"
const MAX_CHIPS = 3

function longDate(key: string) {
  return new Date(key + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

type FormProps = {
  initial: CalendarEvent | null
  defaultDate: string
  onSave: (draft: EventDraft) => Promise<void>
  onCancel: () => void
}

// Add or edit an event: title, day and an optional description
function EventForm({ initial, defaultDate, onSave, onCancel }: FormProps) {
  let startTitle = ''
  let startDate = defaultDate
  let startDescription = ''
  if (initial) {
    startTitle = initial.title
    startDate = initial.date
    startDescription = initial.description
  }
  const [title, setTitle] = useState(startTitle)
  const [date, setDate] = useState(startDate)
  const [description, setDescription] = useState(startDescription)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (title.trim() === '' || title.trim().length > MAX_TITLE || date === '' || description.length > MAX_DESCRIPTION) {
      setError('Give the event a title and a date.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await onSave({ title: title.trim(), date, description: description.trim() })
    } catch (saveError) {
      setError((saveError as Error).message)
      setSaving(false)
    }
  }

  let heading = 'New event'
  let submitText = 'Add event'
  if (initial) {
    heading = 'Edit event'
    submitText = 'Save'
  }
  if (saving) {
    submitText = 'Saving…'
  }

  return (
    <form className="cal-form" onSubmit={handleSubmit}>
      <h3 className="cal-form-title">{heading}</h3>
      <label className="auth-field">
        <span>Title</span>
        <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={MAX_TITLE} autoFocus />
      </label>
      <label className="auth-field">
        <span>Date</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="auth-field">
        <span>Description (optional)</span>
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={MAX_DESCRIPTION}
          placeholder="Where, who, notes…"
        />
      </label>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="cal-form-actions">
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

export default function Calendar() {
  const today = dayKey(new Date())
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selected, setSelected] = useState(today)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [confirmingId, setConfirmingId] = useState('')
  const [actionError, setActionError] = useState('')

  const cells = monthGrid(year, month)
  const from = cells[0].key
  const to = cells[cells.length - 1].key

  function load() {
    setLoadState('loading')
    listEvents(from, to)
      .then((rows) => {
        setEvents(rows)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }

  // Load the six weeks on screen whenever the month changes
  useEffect(load, [from, to])

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1, 12)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  function goToToday() {
    setYear(new Date().getFullYear())
    setMonth(new Date().getMonth())
    setSelected(today)
  }

  function selectDay(key: string) {
    setSelected(key)
    setFormOpen(false)
    setEditing(null)
    setConfirmingId('')
    // Clicking a grey day from the next or previous month jumps to that month
    const date = new Date(key + 'T12:00:00')
    if (date.getMonth() !== month || date.getFullYear() !== year) {
      setYear(date.getFullYear())
      setMonth(date.getMonth())
    }
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(event: CalendarEvent) {
    setEditing(event)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSave(draft: EventDraft) {
    let saved: CalendarEvent
    if (editing) {
      saved = await updateEvent(editing.id, draft)
      setEvents((rows) => rows.filter((row) => row.id !== saved.id))
    } else {
      saved = await createEvent(draft)
    }
    // Keep it on screen only if its day is in the six weeks being shown
    if (saved.date >= from && saved.date <= to) {
      setEvents((rows) => [...rows, saved])
    }
    closeForm()
    selectDay(saved.date)
  }

  async function removeEvent(event: CalendarEvent) {
    setActionError('')
    setConfirmingId('')
    setEvents((rows) => rows.filter((row) => row.id !== event.id))
    try {
      await deleteEvent(event.id)
    } catch (error) {
      setEvents((rows) => [...rows, event])
      setActionError('Could not delete that event: ' + (error as Error).message)
    }
  }

  // Events grouped by day, in the order they were added
  const byDay = new Map<string, CalendarEvent[]>()
  for (const event of [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const list = byDay.get(event.date) ?? []
    list.push(event)
    byDay.set(event.date, list)
  }
  const selectedEvents = byDay.get(selected) ?? []

  const monthName = new Date(year, month, 1, 12).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const weekdays = cells.slice(0, 7).map((cell) =>
    new Date(cell.key + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }),
  )

  let eventCountText = 'No events'
  if (selectedEvents.length === 1) {
    eventCountText = '1 event'
  } else if (selectedEvents.length > 1) {
    eventCountText = selectedEvents.length + ' events'
  }

  return (
    <div className="cal-page">
      <header className="tracker-header">
        <div>
          <h1 className="tracker-title">Calendar</h1>
          <p className="tracker-subtitle">Click a day to see or add events</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          Add event
        </button>
      </header>

      {actionError && <p className="auth-error" role="alert">{actionError}</p>}

      <div className="cal-layout">
        <section className="cal-month" aria-label={monthName}>
          <div className="cal-toolbar">
            <button type="button" className="btn btn-secondary cal-today" onClick={goToToday}>
              Today
            </button>
            <div className="cal-arrows">
              <button type="button" className="cal-arrow" onClick={() => changeMonth(-1)} aria-label="Previous month">
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" className="cal-arrow" onClick={() => changeMonth(1)} aria-label="Next month">
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <h2 className="cal-month-name">{monthName}</h2>
            {loadState === 'loading' && <span className="cal-status">Loading…</span>}
          </div>

          {loadState === 'error' && (
            <div className="cal-load-error">
              <p>Couldn't load your events.</p>
              <button type="button" className="btn btn-secondary" onClick={load}>
                Try again
              </button>
            </div>
          )}

          <div className="cal-grid" role="grid">
            {weekdays.map((name) => (
              <div key={name} className="cal-weekday" role="columnheader">
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
              let label = longDate(cell.key)
              if (dayEvents.length > 0) {
                label += ', ' + dayEvents.length + ' event'
                if (dayEvents.length > 1) {
                  label += 's'
                }
              }
              return (
                <button
                  key={cell.key}
                  type="button"
                  role="gridcell"
                  className={cellClass}
                  onClick={() => selectDay(cell.key)}
                  aria-label={label}
                  aria-selected={cell.key === selected}
                >
                  <span className="cal-day-number">{cell.number}</span>
                  <span className="cal-chips">
                    {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                      <span key={event.id} className="cal-chip">
                        {event.title}
                      </span>
                    ))}
                    {dayEvents.length > MAX_CHIPS && (
                      <span className="cal-more">+{dayEvents.length - MAX_CHIPS} more</span>
                    )}
                  </span>
                  {dayEvents.length > 0 && <span className="cal-dot" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </section>

        <aside className="cal-panel" aria-live="polite">
          <div className="cal-panel-head">
            <h2 className="cal-panel-title">{longDate(selected)}</h2>
            <p className="cal-panel-count">{eventCountText}</p>
          </div>

          {formOpen && (
            <EventForm
              key={editing?.id ?? 'new-' + selected}
              initial={editing}
              defaultDate={selected}
              onSave={handleSave}
              onCancel={closeForm}
            />
          )}

          {!formOpen && selectedEvents.length === 0 && (
            <p className="cal-empty">Nothing planned for this day.</p>
          )}

          {selectedEvents.length > 0 && (
            <ul className="cal-events">
              {selectedEvents.map((event) => (
                <li key={event.id} className="cal-event">
                  <h3 className="cal-event-title">{event.title}</h3>
                  {event.description !== '' && <p className="cal-event-description">{event.description}</p>}
                  <div className="cal-event-actions">
                    <button type="button" className="link-btn" onClick={() => openEdit(event)}>
                      Edit
                    </button>
                    {confirmingId !== event.id && (
                      <button type="button" className="link-btn link-btn-danger" onClick={() => setConfirmingId(event.id)}>
                        Delete
                      </button>
                    )}
                    {confirmingId === event.id && (
                      <span className="cal-confirm">
                        Delete?
                        <button type="button" className="link-btn link-btn-danger" onClick={() => removeEvent(event)}>
                          Yes
                        </button>
                        <button type="button" className="link-btn" onClick={() => setConfirmingId('')}>
                          No
                        </button>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!formOpen && (
            <button type="button" className="btn btn-secondary cal-add-day" onClick={openNew}>
              + Add event on this day
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}
