// Made-up sample data for the examples on the landing page (never saved anywhere)
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

// Sample habits: which of the last 7 days (0 = six days ago, 6 = today) are checked
export const SAMPLE_HABITS = [
  { id: 'h1', name: 'Apply to 5 internships', icon: '💻', done: [2, 3, 4, 5, 6], total: 23 },
  { id: 'h2', name: 'Gym', icon: '💪', done: [0, 1, 3, 4, 5], total: 41 },
  { id: 'h3', name: 'Read 20 pages', icon: '📘', done: [0, 2, 4], total: 12 },
  { id: 'h4', name: 'Drink 8 glasses of water', icon: '💧', done: [], total: 6 },
]
