// The pages in the top menu, and the order the person has dragged them into.
// The order is saved on this device (like the theme), so nothing goes to the server.

export type NavPage = { id: string; to: string; label: string }

export const NAV_PAGES: NavPage[] = [
  { id: 'pomodoro', to: '/pomodoro', label: 'Pomodoro' },
  { id: 'todos', to: '/todos', label: 'To-Do' },
  { id: 'calendar', to: '/calendar', label: 'Calendar' },
  { id: 'internships', to: '/internships', label: 'Jobs' },
  { id: 'habits', to: '/habits', label: 'Habits' },
  { id: 'roadmap', to: '/roadmap', label: 'Roadmap' },
]

const STORAGE_KEY = 'navOrder'
// Lets the menu update straight away when Settings resets the order
export const NAV_ORDER_EVENT = 'nav-order-change'

const DEFAULT_ORDER = NAV_PAGES.map((page) => page.id)

// The saved order, cleaned up: unknown ids are dropped and pages added later go at the end
export function loadNavOrder(): string[] {
  let saved: unknown = null
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    saved = null
  }
  if (!Array.isArray(saved)) {
    return DEFAULT_ORDER
  }
  const known = saved.filter((id): id is string => typeof id === 'string' && DEFAULT_ORDER.includes(id))
  const unique = known.filter((id, index) => known.indexOf(id) === index)
  return [...unique, ...DEFAULT_ORDER.filter((id) => !unique.includes(id))]
}

export function saveNavOrder(order: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  } catch {
    // storage is unavailable, so the order just won't be remembered
  }
}

export function resetNavOrder() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to remove
  }
  window.dispatchEvent(new Event(NAV_ORDER_EVENT))
}

export function isDefaultNavOrder(order: string[]) {
  return order.join(',') === DEFAULT_ORDER.join(',')
}
