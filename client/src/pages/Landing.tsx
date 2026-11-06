import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  CalendarPreview,
  HabitsPreview,
  JobsPreview,
  PomodoroPreview,
  TodosPreview,
} from '../components/LandingPreviews'
import AppCards, { APP_CARDS, type AppCardId } from '../components/AppCards'
import { authClient } from '../lib/auth-client'
import '../internships.css'
import LegalLinks from '../components/LegalLinks'
import '../landing.css'

// The roadmap example uses the large React Flow library, so it loads on its own
const RoadmapExample = lazy(() => import('../components/RoadmapExample'))

// Moving the mouse across the hand passes over several cards; only switch the
// preview once the pointer settles on one, so it doesn't flicker
const HOVER_SWITCH_MS = 140

export default function Landing() {
  const { data: session, isPending } = authClient.useSession()
  const [preview, setPreview] = useState<AppCardId>('jobs')
  const [hovered, setHovered] = useState<AppCardId | null>(null)

  useEffect(() => {
    if (!hovered || hovered === preview) {
      return
    }
    const timer = setTimeout(() => setPreview(hovered), HOVER_SWITCH_MS)
    return () => clearTimeout(timer)
  }, [hovered, preview])

  // Logged-in users go straight to the app
  if (isPending) {
    return <p className="auth-loading">Loading…</p>
  }
  if (session) {
    return <Navigate to="/pomodoro" replace />
  }

  const activeIndex = APP_CARDS.findIndex((card) => card.id === preview)
  const activeCard = APP_CARDS[activeIndex]
  // The preview grows out of the spot where its card sits in the hand
  const zoomOrigin = Math.round(((activeIndex + 0.5) / APP_CARDS.length) * 100)

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
        <div className="landing-window">
          <div className="landing-window-bar">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <p className="landing-window-title">{activeCard.name}</p>
          </div>
          <div className="landing-window-body">
            <div
              key={preview}
              className="landing-zoom"
              style={{ transformOrigin: zoomOrigin + '% 100%' }}
            >
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
        </div>

        <AppCards
          active={preview}
          hovered={hovered}
          onHover={setHovered}
          onPick={(id) => {
            setHovered(null)
            setPreview(id)
          }}
        />
        <p className="landing-hint">
          <span className="landing-hint-hover">Hover over a card to preview it</span>
        </p>
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
