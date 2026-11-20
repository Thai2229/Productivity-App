import { useLayoutEffect, useState } from 'react'

// Loads the taste kit (public/assets) for the landing page only, and takes it away again
// when the visitor leaves, so its resets and body styles never reach the app pages.

const KIT_CSS = [
  'system.css',
  'ui/cards.css',
  'motion/motion.css',
  'backgrounds/backgrounds.css',
  'layout/layout.css',
  'icons/icon.css',
]

const KIT_SCRIPTS = ['system.js', 'layout/layout.js', 'motion/motion.js']

// The palette and type, as `start.mjs css` printed them (kept after the kit's stylesheets)
const PALETTE = `:root {
  --p-bg: #ffffff; --p-surface: #f3f3f3; --p-ink: #232323; --p-muted: #686868;
  --p-accent: #a1ffcb; --p-accent-ink: #232323; --p-action: #232323; --p-action-ink: #ffffff;
  --p-inv-bg: #232323; --p-inv-surface: #303030; --p-inv-ink: #ffffff; --p-inv-muted: #a4a4a4;
  --p-inv-accent: #a1ffcb; --p-inv-accent-ink: #232323; --p-inv-action: #a1ffcb; --p-inv-action-ink: #232323;
  --font-display: "Host Grotesk", system-ui, sans-serif;
  --font-text: "Host Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500;
  --display-tracking: -0.035em;
  --display-tracking-xl: -0.04em;
}`

const TITLE = 'Productivity App: free study and job-hunt app for students'
const DESCRIPTION =
  'A Pomodoro timer, to-do list, calendar, job tracker, habit streaks and skill roadmaps in one free account.'

const HTML_ATTRS: Record<string, string> = {
  'data-type': 'software',
  'data-radius': 'soft',
  'data-ground': 'sky',
  'data-buttons': 'solid',
  'data-motion': '',
}

const KIT_BASE = '/assets/'

// A plain import() that Vite leaves alone, since the kit's files are served as they are from public/
const loadModule: (url: string) => Promise<{ default: { init: () => void } }> = new Function(
  'url',
  'return import(url)',
) as never

// The kit's scripts start themselves the first time they load; later visits start them again
let kitScriptsLoaded = false

function addMeta(attr: 'name' | 'property', key: string, content: string, added: Element[]) {
  const meta = document.createElement('meta')
  meta.setAttribute(attr, key)
  meta.setAttribute('content', content)
  document.head.append(meta)
  added.push(meta)
}

function addLink(href: string, added: Element[]) {
  return new Promise<void>((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = KIT_BASE + href
    link.dataset.landingKit = ''
    link.addEventListener('load', () => resolve())
    link.addEventListener('error', () => resolve())
    document.head.append(link)
    added.push(link)
  })
}

// Returns the elements the page portals into (the kit wants header.nav and footer.closing right under body)
export function useLandingKit() {
  const [hosts] = useState(() => {
    const header = document.createElement('header')
    header.className = 'nav'
    const footer = document.createElement('footer')
    footer.className = 'footer closing footer--statement'
    footer.id = 'contact'
    footer.setAttribute('aria-labelledby', 'close-h')
    const bar = document.createElement('nav')
    bar.className = 'actionbar'
    bar.setAttribute('aria-label', 'Quick actions')
    return { header, footer, bar }
  })

  useLayoutEffect(() => {
    const html = document.documentElement
    const headBefore = new Set(Array.from(document.head.children))
    const added: Element[] = []
    const savedAttrs: Record<string, string | null> = {}
    const names = ['data-theme', 'data-palette', ...Object.keys(HTML_ATTRS)]
    for (const name of names) {
      savedAttrs[name] = html.getAttribute(name)
    }
    html.removeAttribute('data-theme')
    html.removeAttribute('data-palette')
    for (const name of Object.keys(HTML_ATTRS)) {
      html.setAttribute(name, HTML_ATTRS[name])
    }
    html.classList.add('is-landing', 'landing-wait', 'm-enter', 'mo-js')
    const enterTimer = setTimeout(() => html.classList.add('m-enter-done'), 700)
    const safeTimer = setTimeout(() => html.classList.add('mo-safe'), 2500)

    const savedTitle = document.title
    document.title = TITLE
    addMeta('name', 'description', DESCRIPTION, added)
    addMeta('name', 'page-type', 'software', added)
    addMeta('name', 'site-kind', 'software', added)
    addMeta('name', 'theme-color', '#ffffff', added)
    addMeta('property', 'og:type', 'website', added)
    addMeta('property', 'og:title', TITLE, added)
    addMeta('property', 'og:description', DESCRIPTION, added)
    addMeta('property', 'og:image', KIT_BASE + 'share.jpg', added)
    addMeta('name', 'twitter:card', 'summary_large_image', added)

    const styles = Promise.all(KIT_CSS.map((href) => addLink(href, added))).then(() => {
      const palette = document.createElement('style')
      palette.textContent = PALETTE
      document.head.append(palette)
      added.push(palette)
    })

    const main = document.querySelector('main')
    const savedMainId = main?.getAttribute('id') ?? null
    main?.setAttribute('id', 'top')

    const { header, footer, bar } = hosts
    document.body.prepend(header)
    document.body.append(footer, bar)

    let cancelled = false
    styles.then(async () => {
      // Wait two frames so React has drawn into the header and footer before the scripts look for them
      await new Promise((resolve) => requestAnimationFrame(resolve))
      await new Promise((resolve) => requestAnimationFrame(resolve))
      html.classList.remove('landing-wait')
      for (const file of KIT_SCRIPTS) {
        if (cancelled) {
          return
        }
        const url: string = KIT_BASE + file
        const mod = await loadModule(url)
        if (kitScriptsLoaded) {
          mod.default.init()
        }
      }
      kitScriptsLoaded = true
    })

    return () => {
      cancelled = true
      clearTimeout(enterTimer)
      clearTimeout(safeTimer)
      for (const element of added) {
        element.remove()
      }
      // also what the kit's own scripts added to the head (moment stylesheets, injected styles)
      for (const element of Array.from(document.head.children)) {
        if (!headBefore.has(element)) {
          element.remove()
        }
      }
      for (const name of names) {
        const value = savedAttrs[name]
        if (value === null) {
          html.removeAttribute(name)
        } else {
          html.setAttribute(name, value)
        }
      }
      html.classList.remove('is-landing', 'landing-wait', 'm-enter', 'm-enter-done', 'mo-js', 'mo-safe')
      html.removeAttribute('data-ready')
      html.removeAttribute('data-moments-ready')
      html.removeAttribute('data-tone')
      document.title = savedTitle
      if (savedMainId === null) {
        main?.removeAttribute('id')
      } else {
        main?.setAttribute('id', savedMainId)
      }
      header.remove()
      footer.remove()
      bar.remove()
    }
  }, [hosts])

  return hosts
}
