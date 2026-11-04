// Every theme on the Appearance tab. The extra ones are dark themes with their own colors
// (see index.css). Keep the ids in sync with public/theme.js, which applies the saved theme on load.

export type ThemeId =
  | 'light'
  | 'dark'
  | 'midnight'
  | 'cyberpunk'
  | 'obsidian'
  | 'forest'
  | 'ocean'
  | 'sunset'
  | 'crimson'

export type ThemeOption = {
  id: ThemeId
  label: string
  mode: 'light' | 'dark'
}

export const THEMES: ThemeOption[] = [
  { id: 'light', label: 'Light', mode: 'light' },
  { id: 'dark', label: 'Dark', mode: 'dark' },
  { id: 'midnight', label: 'Midnight purple', mode: 'dark' },
  { id: 'cyberpunk', label: 'Cyberpunk neon', mode: 'dark' },
  { id: 'obsidian', label: 'Obsidian blue', mode: 'dark' },
  { id: 'forest', label: 'Deep forest', mode: 'dark' },
  { id: 'ocean', label: 'Ocean teal', mode: 'dark' },
  { id: 'sunset', label: 'Sunset gradient', mode: 'dark' },
  { id: 'crimson', label: 'Crimson noir', mode: 'dark' },
]

// The palette name for the extra themes; Light and Dark don't have one
export function paletteFor(theme: ThemeOption) {
  if (theme.id === 'light' || theme.id === 'dark') {
    return undefined
  }
  return theme.id
}

export function getCurrentTheme(): ThemeId {
  const root = document.documentElement
  const palette = root.getAttribute('data-palette')
  const found = THEMES.find((theme) => theme.id === palette)
  if (found) {
    return found.id
  }
  if (root.getAttribute('data-theme') === 'dark') {
    return 'dark'
  }
  return 'light'
}

export function applyTheme(theme: ThemeOption) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme.mode)

  const palette = paletteFor(theme)
  if (palette) {
    root.setAttribute('data-palette', palette)
  } else {
    root.removeAttribute('data-palette')
  }

  try {
    localStorage.setItem('theme', theme.id)
  } catch {
    // storage is unavailable, so the choice just won't be remembered
  }
}
