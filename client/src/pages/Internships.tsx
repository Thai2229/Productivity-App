import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FlowChart from '../components/FlowChart'
import InternshipForm from '../components/InternshipForm'
import {
  STAGES,
  createInternship,
  deleteInternship,
  listInternships,
  stageLabel,
  updateInternship,
  type Internship,
  type InternshipDraft,
  type Stage,
} from '../lib/internships'
import '../internships.css'

type Filter = Stage | 'ALL'
type LoadState = 'loading' | 'ready' | 'error'

// Dates are saved as midnight UTC, so show them in UTC to avoid an off-by-one day
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function Internships() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Internship | null>(null)
  const [confirmingId, setConfirmingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  // The view lives in the address (?view=flow) so refresh and the back button keep it
  let view = 'board'
  if (searchParams.get('view') === 'flow') {
    view = 'flow'
  }

  function showBoard() {
    setSearchParams({})
  }

  function showFlow() {
    setSearchParams({ view: 'flow' })
  }

  async function load() {
    try {
      const rows = await listInternships()
      setInternships(rows)
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

  function openNew() {
    setEditing(null)
    setFormOpen(true)
    setActionError('')
  }

  function openEdit(internship: Internship) {
    setEditing(internship)
    setFormOpen(true)
    setActionError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSave(draft: InternshipDraft) {
    if (editing) {
      const saved = await updateInternship(editing.id, draft)
      setInternships((rows) => rows.map((row) => {
        if (row.id === saved.id) {
          return saved
        }
        return row
      }))
    } else {
      const saved = await createInternship(draft)
      setInternships((rows) => [saved, ...rows])
    }
    closeForm()
  }

  async function changeStage(internship: Internship, stage: Stage) {
    setActionError('')
    try {
      const saved = await updateInternship(internship.id, { stage })
      setInternships((rows) => rows.map((row) => {
        if (row.id === saved.id) {
          return saved
        }
        return row
      }))
    } catch (error) {
      setActionError('Could not change the stage: ' + (error as Error).message)
    }
  }

  async function handleDelete(id: string) {
    setActionError('')
    try {
      await deleteInternship(id)
      setInternships((rows) => rows.filter((row) => row.id !== id))
      setConfirmingId('')
    } catch (error) {
      setActionError('Could not delete: ' + (error as Error).message)
    }
  }

  const searchText = search.trim().toLowerCase()
  const visible = internships.filter((row) => {
    const matchesStage = filter === 'ALL' || row.stage === filter
    const matchesSearch =
      searchText === '' ||
      row.company.toLowerCase().includes(searchText) ||
      row.role.toLowerCase().includes(searchText)
    return matchesStage && matchesSearch
  })

  function countFor(stage: Stage) {
    return internships.filter((row) => row.stage === stage).length
  }

  if (loadState === 'loading') {
    return <p className="auth-loading">Loading your jobs…</p>
  }

  if (loadState === 'error') {
    return (
      <div className="tracker tracker-empty">
        <p>Couldn't load your jobs. Check your connection and try again.</p>
        <button type="button" className="btn btn-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    )
  }

  let emptyMessage = ''
  if (internships.length === 0) {
    emptyMessage = 'No jobs yet. Add the first one you applied to.'
  } else if (visible.length === 0 && searchText !== '') {
    emptyMessage = 'Nothing matches "' + search.trim() + '".'
  } else if (visible.length === 0) {
    emptyMessage = 'Nothing in ' + stageLabel(filter as Stage) + ' yet.'
  }

  let countText = internships.length + ' applications'
  if (internships.length === 1) {
    countText = '1 application'
  }

  return (
    <div className="tracker">
      <header className="tracker-header">
        <div>
          <h1 className="tracker-title">Job Tracker</h1>
          <p className="tracker-subtitle">
            {countText}
          </p>
        </div>
        {!formOpen && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            Add job
          </button>
        )}
      </header>

      {formOpen && (
        <InternshipForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}

      <div className="view-toggle" role="group" aria-label="Choose a view">
        <button type="button" aria-pressed={view === 'board'} onClick={showBoard}>
          Board
        </button>
        <button type="button" aria-pressed={view === 'flow'} onClick={showFlow}>
          Flow
        </button>
      </div>

      {view === 'flow' && internships.length > 0 && <FlowChart internships={internships} />}

      {view === 'flow' && internships.length === 0 && (
        <div className="tracker-empty">
          <p>Add a job to see where your applications go.</p>
        </div>
      )}

      {view === 'board' && (
        <>
          <div className="pipeline" role="group" aria-label="Filter by stage">
            <button
              type="button"
              className="pipeline-step"
              aria-pressed={filter === 'ALL'}
              onClick={() => setFilter('ALL')}
            >
              <span className="pipeline-count">{internships.length}</span>
              <span className="pipeline-label">All</span>
            </button>
            {STAGES.map((stage) => (
              <button
                key={stage.value}
                type="button"
                className="pipeline-step"
                data-stage={stage.value}
                aria-pressed={filter === stage.value}
                onClick={() => setFilter(stage.value)}
              >
                <span className="pipeline-count">{countFor(stage.value)}</span>
                <span className="pipeline-label">{stage.label}</span>
              </button>
            ))}
          </div>

          {internships.length > 0 && (
            <input
              className="tracker-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company or role"
              aria-label="Search company or role"
            />
          )}

          {actionError && <p className="auth-error" role="alert">{actionError}</p>}

          {emptyMessage && (
            <div className="tracker-empty">
              <p>{emptyMessage}</p>
            </div>
          )}

          <ul className="tracker-list">
            {visible.map((row) => (
              <li key={row.id} className="tracker-item" data-stage={row.stage}>
                <div className="tracker-main">
                  <p className="tracker-company">{row.company}</p>
                  <p className="tracker-role">{row.role}</p>
                  <p className="tracker-meta">
                    {row.location && <span>{row.location}</span>}
                    {row.appliedOn && <span>Applied {formatDate(row.appliedOn)}</span>}
                    {row.link && (
                      <a href={row.link} target="_blank" rel="noopener noreferrer">
                        Job posting ↗
                      </a>
                    )}
                  </p>
                  {row.notes && <p className="tracker-notes">{row.notes}</p>}
                </div>

                <div className="tracker-side">
                  <label className="stage-select">
                    <span className="stage-dot" aria-hidden="true" />
                    <select
                      value={row.stage}
                      onChange={(event) => changeStage(row, event.target.value as Stage)}
                      aria-label={'Stage for ' + row.company}
                    >
                      {STAGES.map((stage) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {confirmingId === row.id && (
                    <div className="tracker-actions">
                      <span className="tracker-confirm">Delete?</span>
                      <button
                        type="button"
                        className="link-btn link-btn-danger"
                        onClick={() => handleDelete(row.id)}
                      >
                        Yes, delete
                      </button>
                      <button type="button" className="link-btn" onClick={() => setConfirmingId('')}>
                        Cancel
                      </button>
                    </div>
                  )}

                  {confirmingId !== row.id && (
                    <div className="tracker-actions">
                      <button type="button" className="link-btn" onClick={() => openEdit(row)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn-danger"
                        onClick={() => setConfirmingId(row.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}