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

// The palette and type live in public/assets/palette.css, loaded after the kit's stylesheets.
// It is a file, not an inline <style>, because the site's Content-Security-Policy blocks inline styles.

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

// A plain import() that Vite leaves alone, since the kit's files are served as they are from public/.
// No new Function()/eval here: the site's Content-Security-Policy forbids it and the whole app would fail to load.
function loadModule(url: string): Promise<{ default: { init: () => void } }> {
  return import(/* @vite-ignore */ url)
}

// The kit's scripts start themselves the first time they load; later visits start them again
const loadedKitScripts = new Set<string>()

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
    return { header, footer }
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

    const styles = Promise.all([...KIT_CSS, 'palette.css'].map((href) => addLink(href, added)))

    const main = document.querySelector('main')
    const savedMainId = main?.getAttribute('id') ?? null
    main?.setAttribute('id', 'top')

    const { header, footer } = hosts
    document.body.prepend(header)
    document.body.append(footer)

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
        const seen = loadedKitScripts.has(file)
        const mod = await loadModule(url)
        loadedKitScripts.add(file)
        if (seen) {
          mod.default.init()
        }
      }
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
    }
  }, [hosts])

  return hosts
}
