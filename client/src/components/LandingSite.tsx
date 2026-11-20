import { lazy, Suspense, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { CalendarPreview, HabitsPreview, JobsPreview, PomodoroPreview, TodosPreview } from './LandingPreviews'
import AppCards from './AppCards'
import LegalLinks from './LegalLinks'
import { APP_CARDS, type AppCardId } from '../lib/landing-samples'
import { useLandingKit } from './LandingKit'
import '../internships.css'
import '../landing.css'

// The roadmap example uses the large React Flow library, so it loads on its own
const RoadmapExample = lazy(() => import('./RoadmapExample'))

const MAIN_ACTION = 'Create a free account'

// Moving the mouse across the hand passes over several cards; only switch the
// preview once the pointer settles on one, so it doesn't flicker
const HOVER_SWITCH_MS = 140

// Draws a preview at a fixed design width and shrinks it to the box it sits in
// With `fit` it only shrinks: a box wider than `base` gets the preview at the box's own width
function Scaled({ base, fit = false, children }: { base: number; fit?: boolean; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [width, setWidth] = useState(base)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const box = outer.current
    const content = inner.current
    if (!box || !content) {
      return
    }
    function measure() {
      if (!box || !content) {
        return
      }
      let designWidth = base
      if (fit) {
        designWidth = Math.max(base, box.clientWidth)
      }
      const next = box.clientWidth / designWidth
      setWidth(designWidth)
      setScale(next)
      setHeight(content.offsetHeight * next)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    observer.observe(content)
    measure()
    return () => observer.disconnect()
  }, [base, fit])

  return (
    <div ref={outer} className="scaled" style={{ height }}>
      <div ref={inner} className="scaled__inner" style={{ width, transform: 'scale(' + scale + ')' }}>
        {children}
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="wrap nav__bar">
      <a className="skip-link" href="#top">
        Skip to content
      </a>
      <a className="nav__logo" href="#top">
        <span className="mark" data-mark="ring" aria-hidden="true"></span>Productivity App
      </a>
      <div className="nav__actions">
        <Link className="nav__link" to="/login">
          Log in
        </Link>
        <Link className="btn btn--primary" to="/signup">
          {MAIN_ACTION}
        </Link>
      </div>
    </div>
  )
}

function Footer({ onPick }: { onPick: (id: AppCardId) => void }) {
  // The names pick that tool in the hero, so the page goes back up to it
  function openTool(event: MouseEvent<HTMLAnchorElement>, id: AppCardId) {
    event.preventDefault()
    onPick(id)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="wrap">
      <div className="closing__cta close--word">
        <div className="section-head--split">
          <div>
            <h2 id="close-h">Sign up</h2>
          </div>
          <Link className="btn btn--primary" to="/signup">
            {MAIN_ACTION}
          </Link>
        </div>
        <p className="close__word" aria-hidden="true">
          Productivity App
        </p>
      </div>
      <div className="closing__links">
        <div className="grid">
          <div className="span-4 stack-4">
            <a className="nav__logo" href="#top">
              <span className="mark" data-mark="ring" aria-hidden="true"></span>Productivity App
            </a>
          </div>
          <div className="span-5 start-7 footer__col">
            <ul className="footer__tools">
              {APP_CARDS.map((card) => (
                <li key={card.id}>
                  <a href={'#tool-' + card.id} onClick={(event) => openTool(event, card.id)}>
                    {card.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="span-2 footer__col">
            <ul>
              <li>
                <Link to="/login">Log in</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__legal">
          <span>&copy; 2026 Productivity App</span>
          <LegalLinks />
        </div>
      </div>
    </div>
  )
}

export default function LandingSite() {
  const hosts = useLandingKit()
  const [tool, setTool] = useState<AppCardId>('todos')
  const [hovered, setHovered] = useState<AppCardId | null>(null)

  // A link such as #tool-habits opens that tool in the window
  useEffect(() => {
    function openFromHash() {
      const found = APP_CARDS.find((card) => '#tool-' + card.id === window.location.hash)
      if (found) {
        setTool(found.id)
      }
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  useEffect(() => {
    if (!hovered || hovered === tool) {
      return
    }
    const timer = setTimeout(() => setTool(hovered), HOVER_SWITCH_MS)
    return () => clearTimeout(timer)
  }, [hovered, tool])

  function pickTool(id: AppCardId) {
    setHovered(null)
    setTool(id)
  }

  const activeCard = APP_CARDS.find((card) => card.id === tool) ?? APP_CARDS[0]

  return (
    <>
      {hosts && createPortal(<Header />, hosts.header)}
      {hosts && createPortal(<Footer onPick={pickTool} />, hosts.footer)}

      <section className="hero hero--app" data-enter aria-labelledby="hero-h">
        <div className="wrap">
          <div className="hero-text">
            <div className="hero__top">
              <h1 id="hero-h">Productivity App</h1>
              <Link className="btn btn--primary" to="/signup">
                {MAIN_ACTION}
              </Link>
            </div>
            <div className="ui ui-app app hero__window" id="tool-window" role="region" aria-label={activeCard.name}>
              <div className="app__head">
                <p className="app__title">{activeCard.name}</p>
              </div>
              <div className="app__body" key={tool}>
                {tool === 'pomodoro' && <PomodoroPreview />}
                {tool === 'todos' && <TodosPreview />}
                {tool === 'calendar' && <CalendarPreview />}
                {tool === 'jobs' && (
                  <Scaled base={640} fit>
                    <JobsPreview />
                  </Scaled>
                )}
                {tool === 'habits' && <HabitsPreview />}
                {tool === 'roadmap' && (
                  <Suspense fallback={<div className="landing-roadmap" />}>
                    <RoadmapExample />
                  </Suspense>
                )}
              </div>
            </div>
            <AppCards active={tool} hovered={hovered} onHover={setHovered} onPick={pickTool} />
          </div>
        </div>
      </section>

      <section className="section" id="story" data-moment="letters-assemble" data-statement aria-labelledby="story-h">
        <div className="wrap">
          <h2 id="story-h" className="mo-la__type">
            Why I built this
          </h2>
          <p className="mo-la__sub">
            I&rsquo;m a broke college student. Every productivity app I tried put application tracking, habit streaks and
            roadmaps behind a paywall. So I built my own and made all of it free.
          </p>
        </div>
      </section>
    </>
  )
}
