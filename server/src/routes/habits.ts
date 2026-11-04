import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { perUserLimit, requireUser } from '../lib/session.js'

export const habitsRouter = Router()

// Logged-in users only, and at most 120 requests a minute each
habitsRouter.use(requireUser)
habitsRouter.use(perUserLimit())

// The icons a habit can use. Anything else is refused.
const ICONS = ['📘', '💪', '💧', '🏃', '🧘', '😴', '🥗', '💻', '✍️', '🎸', '🧹', '💊']
const MAX_HABITS = 50
const DAY_MS = 24 * 60 * 60 * 1000

type HabitInput = { name?: string; icon?: string }

// With partial = true (editing), either field may be left out
function readHabit(body: unknown, partial: boolean) {
  const errors: string[] = []
  const data: HabitInput = {}
  const input = (body ?? {}) as Record<string, unknown>

  if (input.name !== undefined || !partial) {
    if (typeof input.name !== 'string' || input.name.trim() === '' || input.name.length > 60) {
      errors.push('Name is required (up to 60 characters)')
    } else {
      data.name = input.name.trim()
    }
  }

  if (input.icon !== undefined || !partial) {
    if (typeof input.icon !== 'string' || !ICONS.includes(input.icon)) {
      errors.push('Icon is not valid')
    } else {
      data.icon = input.icon
    }
  }

  return { data, errors }
}

// A day looks like 2026-11-03. It can't be before 2000 or more than a day ahead
// (a day of slack because the user's time zone may already be on tomorrow).
function readDay(value: string) {
  const date = new Date(value + 'T00:00:00.000Z')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    date.getTime() < Date.UTC(2000, 0, 1) ||
    date.getTime() > Date.now() + DAY_MS
  ) {
    return null
  }
  return date
}

// Shape sent to the page: check-ins as plain day strings
function toJson(habit: { id: string; name: string; icon: string; createdAt: Date; checks: { date: Date }[] }) {
  return {
    id: habit.id,
    name: habit.name,
    icon: habit.icon,
    createdAt: habit.createdAt,
    checks: habit.checks.map((check) => check.date.toISOString().slice(0, 10)),
  }
}

const withChecks = {
  checks: { select: { date: true }, orderBy: { date: 'asc' } },
} as const

// Finds a habit only if it belongs to the logged-in user
function findOwnHabit(id: string, userId: string) {
  return prisma.habit.findFirst({ where: { id, userId } })
}

habitsRouter.get('/', async (_request, response) => {
  const habits = await prisma.habit.findMany({
    where: { userId: response.locals.userId },
    orderBy: { createdAt: 'asc' },
    include: withChecks,
  })
  response.json({ habits: habits.map(toJson) })
})

habitsRouter.post('/', async (request, response) => {
  const { data, errors } = readHabit(request.body, false)

  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }

  const count = await prisma.habit.count({ where: { userId: response.locals.userId } })
  if (count >= MAX_HABITS) {
    response.status(400).json({ error: 'You can have up to ' + MAX_HABITS + ' habits' })
    return
  }

  const habit = await prisma.habit.create({
    data: { name: data.name as string, icon: data.icon as string, userId: response.locals.userId },
    include: withChecks,
  })
  response.status(201).json({ habit: toJson(habit) })
})

habitsRouter.patch('/:id', async (request, response) => {
  const { data, errors } = readHabit(request.body, true)

  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }

  const existing = await findOwnHabit(request.params.id, response.locals.userId)
  if (!existing) {
    response.status(404).json({ error: 'Habit not found' })
    return
  }

  const habit = await prisma.habit.update({
    where: { id: existing.id },
    data,
    include: withChecks,
  })
  response.json({ habit: toJson(habit) })
})

habitsRouter.delete('/:id', async (request, response) => {
  const result = await prisma.habit.deleteMany({
    where: { id: request.params.id, userId: response.locals.userId },
  })

  if (result.count === 0) {
    response.status(404).json({ error: 'Habit not found' })
    return
  }

  response.status(204).end()
})

// Mark a day as done. Doing it twice is harmless.
habitsRouter.put('/:id/checks/:day', async (request, response) => {
  const date = readDay(request.params.day)
  const existing = await findOwnHabit(request.params.id, response.locals.userId)

  if (!existing || !date) {
    response.status(404).json({ error: 'Habit or day not found' })
    return
  }

  await prisma.habitCheck.upsert({
    where: { habitId_date: { habitId: existing.id, date } },
    create: { habitId: existing.id, date },
    update: {},
  })
  response.status(204).end()
})

// Un-mark a day
habitsRouter.delete('/:id/checks/:day', async (request, response) => {
  const date = readDay(request.params.day)
  const existing = await findOwnHabit(request.params.id, response.locals.userId)

  if (!existing || !date) {
    response.status(404).json({ error: 'Habit or day not found' })
    return
  }

  await prisma.habitCheck.deleteMany({ where: { habitId: existing.id, date } })
  response.status(204).end()
})
