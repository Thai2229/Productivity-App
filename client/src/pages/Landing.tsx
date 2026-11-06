import { lazy, Suspense, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  CalendarPreview,
  HabitsPreview,
  JobsPreview,
  PomodoroPreview,
  TodosPreview,
} from '../components/LandingPreviews'
import { authClient } from '../lib/auth-client'
import '../internships.css'
import LegalLinks from '../components/LegalLinks'
import '../landing.css'

// The roadmap example uses the large React Flow library, so it loads on its own
const RoadmapExample = lazy(() => import('../components/RoadmapExample'))

type Preview = 'pomodoro' | 'todos' | 'calendar' | 'jobs' | 'habits' | 'roadmap'

const PREVIEWS: { value: Preview; label: string }[] = [
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'todos', label: 'To-Do' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'habits', label: 'Habits' },
  { value: 'roadmap', label: 'Roadmap' },
]

export default function Landing() {
  const { data: session, isPending } = authClient.useSession()
  const [preview, setPreview] = useState<Preview>('jobs')

  // Logged-in users go straight to the app
  if (isPending) {
    return <p className="auth-loading">Loading…</p>
  }
  if (session) {
    return <Navigate to="/pomodoro" replace />
  }

  return (
    <div className="landing">
      <section className="landing-hero">
        <h1 className="landing-title">Focus. Apply. Grow.</h1>
        <p className="landing-lead">
          A Pomodoro timer, to-do list, calendar, job tracker, habit streaks and skill roadmaps, all in one place and completely free.
        </p>
        <div className="landing-cta">
          <Link to="/signup" className="btn btn-primary">
            Get started
          </Link>
          <Link to="/login" className="btn btn-outline">
            Log in
          </Link>
        </div>
      </section>

      <section className="landing-showcase" aria-label="Preview of the app">
        <div
          className="landing-tabs"
          data-active={PREVIEWS.findIndex((item) => item.value === preview)}
          role="group"
          aria-label="Choose a preview"
        >
          <span className="landing-tabs-thumb" aria-hidden="true" />
          {PREVIEWS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={preview === item.value}
              onClick={() => setPreview(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="landing-window">
          <div className="landing-window-bar" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="landing-window-body">
            {preview === 'pomodoro' && <PomodoroPreview />}
            {preview === 'todos' && <TodosPreview />}
            {preview === 'calendar' && <CalendarPreview />}
            {preview === 'jobs' && <JobsPreview />}
            {preview === 'habits' && <HabitsPreview />}
            {preview === 'roadmap' && (
              <Suspense fallback={<div className="landing-roadmap" />}>
                <RoadmapExample />
              </Suspense>
            )}
          </div>
        </div>
      </section>

      <section className="landing-story">
        <h2>Why I built this</h2>
        <p>
          I'm a broke college student. Every productivity app I tried put the good stuff, like application tracking,
          habit streaks and roadmaps, behind a paywall. So I built my own and made all of it free.
        </p>
      </section>

      <LegalLinks />
    </div>
  )
}
