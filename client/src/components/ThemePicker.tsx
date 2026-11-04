import { useState } from 'react'
import { THEMES, applyTheme, getCurrentTheme, paletteFor, type ThemeId } from '../lib/themes'

// A row of theme squares. Each square shows that theme's real colors:
// the page and card colors on top, and its three accent colors along the bottom.
export default function ThemePicker() {
  const [current, setCurrent] = useState<ThemeId>(getCurrentTheme)

  return (
    <div className="theme-grid" role="radiogroup" aria-label="Theme">
      {THEMES.map((theme) => {
        const selected = theme.id === current
        let optionClass = 'theme-option'
        if (selected) {
          optionClass = 'theme-option theme-option-selected'
        }

        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={optionClass}
            onClick={() => {
              applyTheme(theme)
              setCurrent(theme.id)
            }}
          >
            <span className="theme-swatch" data-theme={theme.mode} data-palette={paletteFor(theme)} aria-hidden="true">
              <span className="theme-swatch-base" />
              <span className="theme-swatch-accents">
                <span className="theme-swatch-work" />
                <span className="theme-swatch-rest" />
                <span className="theme-swatch-long" />
              </span>
              {selected && (
                <span className="theme-swatch-check">
                  <svg viewBox="0 0 16 16" width="10" height="10">
                    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </span>
            <span className="theme-option-name">{theme.label}</span>
          </button>
        )
      })}
    </div>
  )
}
