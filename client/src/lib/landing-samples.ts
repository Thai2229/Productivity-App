// Made-up sample data for the examples on the landing page (never saved anywhere)
import { dayKey, shiftDay, type Habit } from './habits'
import type { Internship, Stage } from './internships'

// Each path is the stages one sample application went through
const SAMPLE_PATHS: Stage[][] = [
  ...Array.from({ length: 11 }, () => ['APPLIED'] as Stage[]),
  ...Array.from({ length: 5 }, () => ['APPLIED', 'REJECTED'] as Stage[]),
  ['APPLIED', 'SCREENING', 'REJECTED'],
  ['APPLIED', 'SCREENING', 'REJECTED'],
  ['APPLIED', 'SCREENING'],
  ['APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'REJECTED'],
  ['APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'FINAL_INTERVIEW'],
  ['APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'FINAL_INTERVIEW', 'OFFER'],
]

export const SAMPLE_INTERNSHIPS: Internship[] = SAMPLE_PATHS.map((path, index) => ({
  id: 'sample-' + index,
  company: 'Sample company ' + (index + 1),
  role: 'Software Engineering Intern',
  stage: path[path.length - 1],
  location: null,
  link: null,
  appliedOn: null,
  notes: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  history: path.map((stage) => ({ stage, changedAt: '2026-10-01T00:00:00.000Z' })),
}))

export const SAMPLE_SKILLS = [
  { id: 'k1', name: 'Linux fundamentals', status: 'LEARNED', x: 0, y: 0 },
  { id: 'k2', name: 'Networking basics', status: 'LEARNED', x: 0, y: 110 },
  { id: 'k3', name: 'Google Cybersecurity Certificate', status: 'LEARNED', x: 0, y: 220 },
  { id: 'k4', name: 'CompTIA Security+', status: 'LEARNING', x: 290, y: 110 },
  { id: 'k5', name: 'CompTIA CySA+', status: 'PLANNED', x: 580, y: 40 },
  { id: 'k6', name: 'Python for security', status: 'PLANNED', x: 580, y: 180 },
  { id: 'k7', name: 'OSCP', status: 'PLANNED', x: 870, y: 110 },
] as const

export const SAMPLE_LINKS = [
  ['k1', 'k4'],
  ['k2', 'k4'],
  ['k3', 'k4'],
  ['k4', 'k5'],
  ['k4', 'k6'],
  ['k5', 'k7'],
  ['k6', 'k7'],
] as const

// Sample habits. Each string is three weeks of check-ins, newest first: character 0 is today, 1 is yesterday, and so on
const SAMPLE_HISTORY = [
  { id: 'h1', name: 'Apply to 5 internships', icon: '💻', history: '111110011101111101110' },
  { id: 'h2', name: 'Gym', icon: '💪', history: '011101111011011110101' },
  { id: 'h3', name: 'Read 20 pages', icon: '📘', history: '001010110110111110111' },
  { id: 'h4', name: 'Drink 8 glasses of water', icon: '💧', history: '000000011101111111011' },
]

export const SAMPLE_HABITS: Habit[] = SAMPLE_HISTORY.map((habit) => {
  const today = dayKey(new Date())
  const checks: string[] = []
  for (let index = habit.history.length - 1; index >= 0; index--) {
    if (habit.history[index] === '1') {
      checks.push(shiftDay(today, -index))
    }
  }
  return { id: habit.id, name: habit.name, icon: habit.icon, createdAt: shiftDay(today, -60) + 'T12:00:00', checks }
})

// Sample to-do tasks. dueIn is days from today (negative = overdue), null = no due date.
export const SAMPLE_TODOS = [
  { id: 't1', title: 'Pay phone bill', description: '', dueIn: -1, done: false },
  { id: 't2', title: 'Grocery run', description: 'Eggs, milk, bread, coffee and something for dinner.', dueIn: 0, done: false },
  { id: 't3', title: 'Call Mom for her birthday', description: 'Order flowers to arrive in the morning.', dueIn: 1, done: false },
  { id: 't4', title: 'Study for midterm', description: 'Chapters 4–6 and the practice exam.', dueIn: 5, done: false },
  { id: 't5', title: 'Do laundry', description: '', dueIn: -2, done: true },
  { id: 't6', title: 'Book a dentist appointment', description: '', dueIn: null, done: true },
]

// Sample calendar events. day is days from today.
export const SAMPLE_EVENTS = [
  { id: 'e1', day: 0, title: 'CSE 120 lecture', description: 'Center Hall 115, 11am' },
  { id: 'e2', day: 0, title: 'Gym', description: '' },
  { id: 'e3', day: 2, title: 'Career fair', description: 'Price Center ballroom, 10am–2pm. Bring 10 resumes.' },
  { id: 'e4', day: -3, title: 'Study group', description: 'Geisel library, 4th floor' },
  { id: 'e5', day: 6, title: 'Midterm', description: 'Bring a calculator.' },
  { id: 'e6', day: 9, title: 'Interview', description: 'Technical round, 45 minutes on Zoom.' },
  { id: 'e7', day: -8, title: 'Dentist', description: '2:30pm' },
]

// The six tools of the app, in the order the landing page's window lists them
export type AppCardId = 'pomodoro' | 'todos' | 'calendar' | 'jobs' | 'habits' | 'roadmap'

export type AppCard = {
  id: AppCardId
  name: string
}

export const APP_CARDS: AppCard[] = [
  { id: 'pomodoro', name: 'Pomodoro timer' },
  { id: 'todos', name: 'To-do list' },
  { id: 'calendar', name: 'Calendar' },
  { id: 'jobs', name: 'Job tracker' },
  { id: 'habits', name: 'Habit tracker' },
  { id: 'roadmap', name: 'Skill roadmaps' },
]
