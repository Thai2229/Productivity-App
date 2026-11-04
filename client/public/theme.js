// Runs before the page draws, so dark mode never flashes white.
// Kept in its own file (not inline in index.html) so the security policy can block inline scripts.
(function () {
  var theme = null
  try {
    theme = localStorage.getItem('theme')
  } catch (error) {
    theme = null
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = 'light'
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark'
    }
  }
  document.documentElement.setAttribute('data-theme', theme)
})()
