// Runs before the page draws, so a dark theme never flashes white.
// Kept in its own file (not inline in index.html) so the security policy can block inline scripts.
// The extra themes are dark themes with their own colors; keep this list in sync with src/lib/themes.ts.
(function () {
  var DARK_PALETTES = ['midnight', 'cyberpunk', 'obsidian', 'forest', 'ocean', 'sunset', 'crimson']
  var theme = null
  try {
    theme = localStorage.getItem('theme')
  } catch (error) {
    theme = null
  }

  var root = document.documentElement
  if (DARK_PALETTES.indexOf(theme) !== -1) {
    root.setAttribute('data-theme', 'dark')
    root.setAttribute('data-palette', theme)
    return
  }

  if (theme !== 'light' && theme !== 'dark') {
    theme = 'light'
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark'
    }
  }
  root.setAttribute('data-theme', theme)
})()
