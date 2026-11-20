import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  CalendarPreview,
  HabitsPreview,
  JobsPreview,
  PomodoroPreview,
  TodosPreview,
} from './LandingPreviews'
import AppCards from './AppCards'
import LegalLinks from './LegalLinks'
import { APP_CARDS, type AppCardId } from '../lib/landing-samples'
import { useLandingKit } from './LandingKit'
import '../internships.css'
import '../landing.css'

// The roadmap example uses the large React Flow library, so it loads on its own
const RoadmapExample = lazy(() => import('./RoadmapExample'))

const MAIN_ACTION = 'Create a free account'

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
      <nav className="nav__links" aria-label="Main">
        <div className="nav__item">
          <a className="nav__link" href="#tools">
            Tools
            <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <div className="nav__menu">
            <div className="wrap grid">
              <div className="menu-col span-3">
                <p className="t-label">Focus</p>
                <a href="#tool-pomodoro">
                  Pomodoro timer
                </a>
                <a href="#tool-todos">
                  To-do list
                </a>
                <a href="#tool-calendar">
                  Calendar
                </a>
              </div>
              <div className="menu-col span-3">
                <p className="t-label">Career and growth</p>
                <a href="#tool-jobs">
                  Job tracker
                </a>
                <a href="#tool-habits">
                  Habit tracker
                </a>
                <a href="#tool-roadmap">
                  Skill roadmaps
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="nav__item">
          <a className="nav__link" href="#story">
            Story
          </a>
        </div>
        <div className="nav__item">
          <a className="nav__link" href="#roadmaps">
            Roadmaps
          </a>
        </div>
        <div className="nav__item">
          <a className="nav__link" href="#jobs">
            Jobs
          </a>
        </div>
      </nav>
      <div className="nav__actions">
        <Link className="nav__link" to="/login">
          Log in
        </Link>
        <Link className="btn btn--primary" to="/signup">
          {MAIN_ACTION}
        </Link>
      </div>
      <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function Footer() {
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
          <div className="span-3 start-7 footer__col">
            <h3>Tools</h3>
            <ul>
              <li><a href="#tool-pomodoro">Pomodoro timer</a></li>
              <li><a href="#tool-todos">To-do list</a></li>
              <li><a href="#tool-calendar">Calendar</a></li>
              <li><a href="#tool-habits">Habit tracker</a></li>
            </ul>
          </div>
          <div className="span-3 footer__col">
            <h3>Career</h3>
            <ul>
              <li><a href="#jobs">Job tracker</a></li>
              <li><a href="#roadmaps">Skill roadmaps</a></li>
              <li><a href="#story">Why I built this</a></li>
              <li><Link to="/login">Log in</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer__legal">
          <span>&copy; 2026 Productivity App</span>
          <div className="socials"></div>
          <LegalLinks />
        </div>
      </div>
    </div>
  )
}

export default function LandingSite() {
  const hosts = useLandingKit()
  const [tool, setTool] = useState<AppCardId>('todos')

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

  const activeCard = APP_CARDS.find((card) => card.id === tool) ?? APP_CARDS[0]

  return (
    <>
      {hosts && createPortal(<Header />, hosts.header)}
      {hosts && createPortal(<Footer />, hosts.footer)}
      {hosts &&
        createPortal(
          <Link className="btn btn--primary" to="/signup">
            {MAIN_ACTION}
          </Link>,
          hosts.bar,
        )}

      <section className="hero hero--triptych" data-enter aria-labelledby="hero-h">
        <div className="wrap">
          <div className="hero-text grid hero__grid">
            <div className="span-3">
              <h1 id="hero-h">Productivity App</h1>
              <ul className="hero__list">
                <li>Pomodoro timer</li>
                <li>To-do list</li>
                <li>Calendar</li>
                <li>Job tracker</li>
                <li>Habit tracker</li>
                <li>Skill roadmaps</li>
              </ul>
            </div>
            <div
              className="ly-collage span-6 start-4"
              role="img"
              aria-label="The Pomodoro timer, to-do list, job application flow chart, habit streaks and calendar of the app"
            >
              <div className="ly-collage__set is-on" inert>
                <div className="ly-piece hp-pomo">
                  <Scaled base={440}>
                    <PomodoroPreview still />
                  </Scaled>
                </div>
                <div className="ly-piece hp-todos">
                  <Scaled base={640}>
                    <TodosPreview />
                  </Scaled>
                </div>
              </div>
              <div className="ly-collage__set" aria-hidden="true" inert>
                <div className="ly-piece hp-jobs">
                  <Scaled base={700}>
                    <JobsPreview />
                  </Scaled>
                </div>
                <div className="ly-piece hp-habits">
                  <Scaled base={560}>
                    <HabitsPreview />
                  </Scaled>
                </div>
              </div>
              <div className="ly-collage__set" aria-hidden="true" inert>
                <div className="ly-piece hp-cal">
                  <Scaled base={760}>
                    <CalendarPreview />
                  </Scaled>
                </div>
              </div>
            </div>
            <div className="span-3 start-10 hero__cta">
              <Link className="btn btn--primary" to="/signup">
                {MAIN_ACTION}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="tools" style={{ '--hm': 2 } as CSSProperties} aria-labelledby="tools-h">
        <div className="wrap">
          <div className="grid">
            <div className="section-head span-5">
              <h2 id="tools-h">Tools</h2>
            </div>
          </div>
          <div className="ui ui-app app fill" data-visual>
            <div className="app__list">
              <AppCards active={tool} onPick={setTool} />
            </div>
            <div className="app__open">
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

      <section className="section" id="roadmaps" aria-labelledby="roadmaps-h">
        <div className="wrap">
          <div className="grid">
            <div className="section-head span-5">
              <h2 id="roadmaps-h">Skill roadmaps</h2>
            </div>
          </div>
          <div className="ui ui-shot shot fill" data-visual>
            <Suspense fallback={<div className="landing-roadmap" />}>
              <RoadmapExample />
            </Suspense>
          </div>
        </div>
      </section>

      <section
        className="section ground-inverse"
        id="jobs"
        data-moment="iris-opens"
        data-moment-opts='{"from": "base"}'
        aria-labelledby="jobs-h"
      >
        <div className="wrap">
          <div className="section-head">
            <h2 id="jobs-h">Job tracker</h2>
          </div>
          <div className="ui ui-shot shot fill" data-visual>
            <Scaled base={640} fit>
              <JobsPreview />
            </Scaled>
          </div>
        </div>
      </section>

    </>
  )
}
