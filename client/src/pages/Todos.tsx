import { useEffect, useState, type FormEvent } from 'react'
import {
  MAX_DESCRIPTION,
  MAX_TITLE,
  createTodo,
  deleteTodo,
  doneLabel,
  dueLabel,
  listTodos,
  sortCurrent,
  sortPast,
  updateTodo,
  type Todo,
  type TodoDraft,
} from '../lib/todos'
import '../todos.css'

type LoadState = 'loading' | 'ready' | 'error'

type FormProps = {
  initial: Todo | null
  onSave: (draft: TodoDraft) => Promise<void>
  onCancel: () => void
}

// Add or edit a task: title, optional due date and optional description
function TodoForm({ initial, onSave, onCancel }: FormProps) {
  let startTitle = ''
  let startDue = ''
  let startDescription = ''
  if (initial) {
    startTitle = initial.title
    startDue = initial.dueDate ?? ''
    startDescription = initial.description
  }
  const [title, setTitle] = useState(startTitle)
  const [dueDate, setDueDate] = useState(startDue)
  const [description, setDescription] = useState(startDescription)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (title.trim() === '' || title.trim().length > MAX_TITLE || description.length > MAX_DESCRIPTION) {
      setError('Give the task a title (up to ' + MAX_TITLE + ' characters).')
      return
    }

    setError('')
    setSaving(true)
    let due: string | null = null
    if (dueDate !== '') {
      due = dueDate
    }
    try {
      await onSave({ title: title.trim(), description: description.trim(), dueDate: due })
    } catch (saveError) {
      setError((saveError as Error).message)
      setSaving(false)
    }
  }

  let heading = 'New task'
  let submitText = 'Add task'
  if (initial) {
    heading = 'Edit task'
    submitText = 'Save'
  }
  if (saving) {
    submitText = 'Saving…'
  }

  return (
    <form className="tracker-form" onSubmit={handleSubmit}>
      <h2 className="tracker-form-title">{heading}</h2>
      <div className="tracker-form-grid todo-form-grid">
        <label className="auth-field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={MAX_TITLE}
            autoFocus
          />
        </label>
        <label className="auth-field">
          <span>Due by (optional)</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label className="auth-field tracker-form-wide">
          <span>Description (optional)</span>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={MAX_DESCRIPTION}
            placeholder="Add more about the task"
          />
        </label>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="tracker-form-actions">
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

type ItemProps = {
  todo: Todo
  onMove: () => void
  onEdit: () => void
  onDelete: () => void
}

// One task. Current tasks have an empty circle to mark them done;
// past tasks have a filled one, and clicking it brings them back.
function TodoItem({ todo, onMove, onEdit, onDelete }: ItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const isPast = todo.status === 'PAST'

  let moveLabel = 'Mark "' + todo.title + '" as done'
  let itemClass = 'todo-item'
  let moveText = 'Move to past'
  if (isPast) {
    moveLabel = 'Move "' + todo.title + '" back to current'
    itemClass = 'todo-item todo-item-past'
    moveText = 'Move to current'
  }

  let badge = null
  if (todo.dueDate) {
    const due = dueLabel(todo.dueDate, isPast)
    badge = (
      <span className={'todo-due todo-due-' + due.tone}>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {due.text}
      </span>
    )
  }

  // Long descriptions are cut to a few lines until opened
  const isLong = todo.description.length > 160 || todo.description.split('\n').length > 3
  let descriptionClass = 'todo-description'
  if (isLong && !expanded) {
    descriptionClass = 'todo-description todo-description-clamped'
  }
  let expandText = 'Show more'
  if (expanded) {
    expandText = 'Show less'
  }

  return (
    <li className={itemClass}>
      <button type="button" className="todo-check" onClick={onMove} aria-label={moveLabel} title={moveText}>
        {isPast && (
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="todo-body">
        <div className="todo-title-line">
          <h3 className="todo-title">{todo.title}</h3>
          {badge}
        </div>
        {todo.description !== '' && <p className={descriptionClass}>{todo.description}</p>}
        <div className="todo-actions">
          {isLong && (
            <button type="button" className="link-btn" onClick={() => setExpanded(!expanded)}>
              {expandText}
            </button>
          )}
          {isPast && <span className="todo-done-date">{doneLabel(todo.completedAt)}</span>}
          <span className="todo-actions-spacer" />
          <button type="button" className="link-btn" onClick={onMove}>
            {moveText}
          </button>
          {!isPast && (
            <button type="button" className="link-btn" onClick={onEdit}>
              Edit
            </button>
          )}
          {!confirming && (
            <button type="button" className="link-btn link-btn-danger" onClick={() => setConfirming(true)}>
              Delete
            </button>
          )}
          {confirming && (
            <span className="todo-confirm">
              Delete?
              <button type="button" className="link-btn link-btn-danger" onClick={onDelete}>
                Yes
              </button>
              <button type="button" className="link-btn" onClick={() => setConfirming(false)}>
                No
              </button>
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [actionError, setActionError] = useState('')

  function load() {
    setLoadState('loading')
    listTodos()
      .then((rows) => {
        setTodos(rows)
        setLoadState('ready')
      })
      .catch(() => setLoadState('error'))
  }

  useEffect(load, [])

  function replaceTodo(saved: Todo) {
    setTodos((rows) => rows.map((row) => {
      if (row.id === saved.id) {
        return saved
      }
      return row
    }))
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(todo: Todo) {
    setEditing(todo)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSave(draft: TodoDraft) {
    if (editing) {
      replaceTodo(await updateTodo(editing.id, draft))
    } else {
      const saved = await createTodo(draft)
      setTodos((rows) => [...rows, saved])
    }
    closeForm()
  }

  // Moves a task between the lists straight away, then saves; puts it back if saving fails
  async function moveTodo(todo: Todo) {
    setActionError('')
    let status: 'CURRENT' | 'PAST' = 'PAST'
    let completedAt: string | null = new Date().toISOString()
    if (todo.status === 'PAST') {
      status = 'CURRENT'
      completedAt = null
    }
    replaceTodo({ ...todo, status, completedAt })
    try {
      replaceTodo(await updateTodo(todo.id, { status }))
    } catch (error) {
      replaceTodo(todo)
      setActionError('Could not move that task: ' + (error as Error).message)
    }
  }

  async function removeTodo(todo: Todo) {
    setActionError('')
    setTodos((rows) => rows.filter((row) => row.id !== todo.id))
    try {
      await deleteTodo(todo.id)
    } catch (error) {
      setTodos((rows) => [...rows, todo])
      setActionError('Could not delete that task: ' + (error as Error).message)
    }
  }

  if (loadState === 'loading') {
    return <p className="auth-loading">Loading your tasks…</p>
  }

  if (loadState === 'error') {
    return (
      <div className="todos tracker-empty">
        <p>Couldn't load your tasks. Check your connection and try again.</p>
        <button type="button" className="btn btn-secondary" onClick={load}>
          Try again
        </button>
      </div>
    )
  }

  const current = sortCurrent(todos.filter((todo) => todo.status === 'CURRENT'))
  const past = sortPast(todos.filter((todo) => todo.status === 'PAST'))

  let subtitle = current.length + ' to do · ' + past.length + ' done'
  if (todos.length === 0) {
    subtitle = 'Plan what needs doing and tick it off'
  }

  function renderList(rows: Todo[]) {
    return (
      <ul className="todo-list">
        {rows.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onMove={() => moveTodo(todo)}
            onEdit={() => openEdit(todo)}
            onDelete={() => removeTodo(todo)}
          />
        ))}
      </ul>
    )
  }

  return (
    <div className="todos">
      <header className="tracker-header">
        <div>
          <h1 className="tracker-title">To-Do</h1>
          <p className="tracker-subtitle">{subtitle}</p>
        </div>
        {!formOpen && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            Add task
          </button>
        )}
      </header>

      {formOpen && <TodoForm key={editing?.id ?? 'new'} initial={editing} onSave={handleSave} onCancel={closeForm} />}

      {actionError && <p className="auth-error" role="alert">{actionError}</p>}

      <div className="todo-columns">
        <section className="todo-column" aria-labelledby="todo-current-heading">
          <h2 className="todo-column-title" id="todo-current-heading">
            Current <span className="todo-count">{current.length}</span>
          </h2>
          {current.length === 0 && (
            <p className="todo-empty">Nothing to do right now. Add a task, or bring one back from Past.</p>
          )}
          {current.length > 0 && renderList(current)}
        </section>

        <section className="todo-column" aria-labelledby="todo-past-heading">
          <h2 className="todo-column-title" id="todo-past-heading">
            Past <span className="todo-count">{past.length}</span>
          </h2>
          {past.length === 0 && <p className="todo-empty">Finished tasks show up here. Tick a circle to move one.</p>}
          {past.length > 0 && renderList(past)}
        </section>
      </div>
    </div>
  )
}
