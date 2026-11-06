import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { perUserLimit, requireUser } from '../lib/session.js'

export const eventsRouter = Router()

// Logged-in users only, and at most 120 requests a minute each
eventsRouter.use(requireUser)
eventsRouter.use(perUserLimit())

const MAX_EVENTS = 2000
const MAX_TITLE = 120
const MAX_DESCRIPTION = 2000
// The calendar asks for one month view at a time (6 weeks); allow a little more
const MAX_RANGE_DAYS = 100
const DAY_MS = 24 * 60 * 60 * 1000

type EventInput = { title?: string; description?: string; date?: Date }

// A day looks like 2026-11-20, between the years 2000 and 2100
function readDay(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }
  const date = new Date(value + 'T00:00:00.000Z')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    date.getUTCFullYear() < 2000 ||
    date.getUTCFullYear() > 2100
  ) {
    return null
  }
  return date
}

// With partial = true (editing), any field may be left out
function readEvent(body: unknown, partial: boolean) {
  const errors: string[] = []
  const data: EventInput = {}
  const input = (body ?? {}) as Record<string, unknown>

  if (input.title !== undefined || !partial) {
    if (typeof input.title !== 'string' || input.title.trim() === '' || input.title.trim().length > MAX_TITLE) {
      errors.push('Title is required (up to ' + MAX_TITLE + ' characters)')
    } else {
      data.title = input.title.trim()
    }
  }

  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.length > MAX_DESCRIPTION) {
      errors.push('Description can be up to ' + MAX_DESCRIPTION + ' characters')
    } else {
      data.description = input.description.trim()
    }
  }

  if (input.date !== undefined || !partial) {
    const date = readDay(input.date)
    if (!date) {
      errors.push('Date is not valid')
    } else {
      data.date = date
    }
  }

  return { data, errors }
}

function toJson(event: { id: string; title: string; description: string; date: Date; createdAt: Date }) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date.toISOString().slice(0, 10),
    createdAt: event.createdAt,
  }
}

// Events between two days (inclusive), for the month on screen
eventsRouter.get('/', async (request, response) => {
  const from = readDay(request.query.from)
  const to = readDay(request.query.to)

  if (!from || !to || to.getTime() < from.getTime() || (to.getTime() - from.getTime()) / DAY_MS > MAX_RANGE_DAYS) {
    response.status(400).json({ error: 'Give a valid from and to date, up to ' + MAX_RANGE_DAYS + ' days apart' })
    return
  }

  const events = await prisma.calendarEvent.findMany({
    where: { userId: response.locals.userId, date: { gte: from, lte: to } },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })
  response.json({ events: events.map(toJson) })
})

eventsRouter.post('/', async (request, response) => {
  const { data, errors } = readEvent(request.body, false)

  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }

  const count = await prisma.calendarEvent.count({ where: { userId: response.locals.userId } })
  if (count >= MAX_EVENTS) {
    response.status(400).json({ error: 'You can have up to ' + MAX_EVENTS + ' events. Delete some old ones first.' })
    return
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title: data.title as string,
      description: data.description ?? '',
      date: data.date as Date,
      userId: response.locals.userId,
    },
  })
  response.status(201).json({ event: toJson(event) })
})

eventsRouter.patch('/:id', async (request, response) => {
  const { data, errors } = readEvent(request.body, true)

  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }

  const existing = await prisma.calendarEvent.findFirst({
    where: { id: request.params.id, userId: response.locals.userId },
  })
  if (!existing) {
    response.status(404).json({ error: 'Event not found' })
    return
  }

  const event = await prisma.calendarEvent.update({ where: { id: existing.id }, data })
  response.json({ event: toJson(event) })
})

eventsRouter.delete('/:id', async (request, response) => {
  const result = await prisma.calendarEvent.deleteMany({
    where: { id: request.params.id, userId: response.locals.userId },
  })

  if (result.count === 0) {
    response.status(404).json({ error: 'Event not found' })
    return
  }

  response.status(204).end()
})
