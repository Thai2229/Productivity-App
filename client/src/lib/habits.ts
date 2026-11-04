// Everything the Habits page needs: talking to /api/habits and working out streaks

export type Habit = {
  id: string
  name: string
  icon: string
  createdAt: string
  checks: string[]
}

export type HabitDraft = {
  name: string
  icon: string
}

// Must match the list on the server
export const HABIT_ICONS = ['📘', '💪', '💧', '🏃', '🧘', '😴', '🥗', '💻', '✍️', '🎸', '🧹', '💊']

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const options: RequestInit = { method, headers: {} }

  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch('/api/habits' + path, options)

  if (response.status === 204) {
    return undefined as T
  }

  let data: { error?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed (' + response.status + ')')
  }

  return data as T
}

export async function listHabits() {
  const data = await request<{ habits: Habit[] }>('', 'GET')
  return data.habits
}

export async function createHabit(draft: HabitDraft) {
  const data = await request<{ habit: Habit }>('', 'POST', draft)
  return data.habit
}

export async function updateHabit(id: string, changes: Partial<HabitDraft>) {
  const data = await request<{ habit: Habit }>('/' + id, 'PATCH', changes)
  return data.habit
}

export async function deleteHabit(id: string) {
  await request<void>('/' + id, 'DELETE')
}

// Marks (done = true) or un-marks a day like 2026-11-03
export async function setCheck(id: string, day: string, done: boolean) {
  let method = 'DELETE'
  if (done) {
    method = 'PUT'
  }
  await request<void>('/' + id + '/checks/' + day, method)
}

// Days are the user's own calendar days, written like 2026-11-03
export function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return date.getFullYear() + '-' + month + '-' + day
}

export function shiftDay(key: string, delta: number) {
  // Noon avoids daylight-saving jumps moving the date
  const date = new Date(key + 'T12:00:00')
  date.setDate(date.getDate() + delta)
  return dayKey(date)
}

// The last `count` days, oldest first, ending today
export function recentDays(count: number) {
  const today = dayKey(new Date())
  const days: { key: string; letter: string; number: number; isToday: boolean }[] = []
  for (let offset = count - 1; offset >= 0; offset--) {
    const key = shiftDay(today, -offset)
    const date = new Date(key + 'T12:00:00')
    days.push({
      key,
      letter: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      number: date.getDate(),
      isToday: offset === 0,
    })
  }
  return days
}

// Days in a row, counting back from today. If today isn't checked yet,
// the streak still counts from yesterday (you have until midnight).
export function streakFor(checks: string[]) {
  const done = new Set(checks)
  let day = dayKey(new Date())
  if (!done.has(day)) {
    day = shiftDay(day, -1)
  }
  let count = 0
  while (done.has(day)) {
    count += 1
    day = shiftDay(day, -1)
  }
  return count
}

export function daysText(count: number) {
  if (count === 1) {
    return '1 Day'
  }
  return count + ' Days'
}

// The first day this habit counts from: the day it was added, or an earlier check-in
export function habitStartKey(habit: Habit) {
  let start = dayKey(new Date(habit.createdAt))
  if (habit.checks.length > 0 && habit.checks[0] < start) {
    start = habit.checks[0]
  }
  return start
}

// Check-ins in one month, and what share of that month's days were checked.
// Only days from when the habit started up to today count toward the rate.
export function monthStats(habit: Habit, year: number, month: number) {
  const prefix = year + '-' + String(month + 1).padStart(2, '0') + '-'
  const checkIns = habit.checks.filter((key) => key.startsWith(prefix)).length

  let first = prefix + '01'
  const start = habitStartKey(habit)
  if (start > first) {
    first = start
  }
  let last = dayKey(new Date(year, month + 1, 0))
  const today = dayKey(new Date())
  if (today < last) {
    last = today
  }

  let countedDays = 0
  let day = first
  while (day <= last) {
    countedDays += 1
    day = shiftDay(day, 1)
  }

  let rate: number | null = null
  if (countedDays > 0) {
    rate = checkIns / countedDays
  }
  return { checkIns, rate }
}

// All the boxes for a month calendar, Sunday first, padded with the
// neighbouring months' days so every week is complete
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1, 12)
  const startKey = shiftDay(dayKey(first), -first.getDay())
  const lastKey = dayKey(new Date(year, month + 1, 0, 12))
  const cells: { key: string; number: number; inMonth: boolean }[] = []
  let key = startKey
  while (key <= lastKey || cells.length % 7 !== 0) {
    const date = new Date(key + 'T12:00:00')
    cells.push({ key, number: date.getDate(), inMonth: date.getMonth() === month })
    key = shiftDay(key, 1)
  }
  return cells
}
