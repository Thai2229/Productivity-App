import { useEffect, useRef, useState } from 'react'

// The bits of Cloudflare's Turnstile script this app uses
declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptLoading: Promise<void> | null = null

// Loads Cloudflare's script once, no matter how many times the form appears
function loadScript() {
  if (window.turnstile) {
    return Promise.resolve()
  }
  if (!scriptLoading) {
    scriptLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptLoading = null
        reject(new Error('Could not load Turnstile'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptLoading
}

type Props = {
  siteKey: string
  // Gets the pass token, or '' when it expires or fails
  onToken: (token: string) => void
}

// Cloudflare's "are you a real person?" check
export default function Turnstile({ siteKey, onToken }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let widgetId: string | null = null
    let cancelled = false

    let theme = 'light'
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      theme = 'dark'
    }

    loadScript()
      .then(() => {
        if (cancelled || !boxRef.current || !window.turnstile) {
          return
        }
        widgetId = window.turnstile.render(boxRef.current, {
          sitekey: siteKey,
          theme,
          action: 'sign-up',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [siteKey, onToken])

  if (failed) {
    return (
      <p className="auth-error" role="alert">
        Couldn't load the bot check. Turn off any ad blocker for this site and refresh.
      </p>
    )
  }

  return <div ref={boxRef} className="turnstile-box" />
}
