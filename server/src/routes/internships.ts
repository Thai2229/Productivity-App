import { Router, type NextFunction, type Request, type Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'
import { InternshipStage } from '../../generated/prisma/client.js'

export const internshipsRouter = Router()

const STAGES = Object.values(InternshipStage)

// Every route below runs this first: no session, no data.
// The user id comes from the session cookie, never from the request body,
// so nobody can ask for someone else's internships.
async function requireUser(request: Request, response: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })

  if (!session) {
    response.status(401).json({ error: 'Not logged in' })
    return
  }

  response.locals.userId = session.user.id
  next()
}

internshipsRouter.use(requireUser)

type InternshipInput = {
  company?: string
  role?: string
  stage?: InternshipStage
  location?: string | null
  link?: string | null
  appliedOn?: Date | null
  notes?: string | null
}

// Optional text: missing stays missing, blank becomes null (cleared)
function readOptionalText(value: unknown, label: string, maxLength: number, errors: string[]) {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  if (typeof value !== 'string' || value.length > maxLength) {
    errors.push(label + ' must be text under ' + maxLength + ' characters')
    return undefined
  }
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  return trimmed
}

// Checks the request body. With partial = true (editing), any field may be left out.
function readInternship(body: unknown, partial: boolean) {
  const errors: string[] = []
  const data: InternshipInput = {}
  const input = (body ?? {}) as Record<string, unknown>

  for (const field of ['company', 'role'] as const) {
    const value = input[field]
    const label = field.charAt(0).toUpperCase() + field.slice(1)

    if (value === undefined && partial) {
      continue
    }
    if (typeof value !== 'string' || value.trim() === '' || value.length > 100) {
      errors.push(label + ' is required (up to 100 characters)')
      continue
    }
    data[field] = value.trim()
  }

  if (input.stage !== undefined) {
    if (typeof input.stage !== 'string' || !STAGES.includes(input.stage as InternshipStage)) {
      errors.push('Stage is not valid')
    } else {
      data.stage = input.stage as InternshipStage
    }
  }

  data.location = readOptionalText(input.location, 'Location', 100, errors)
  data.notes = readOptionalText(input.notes, 'Notes', 2000, errors)

  const link = readOptionalText(input.link, 'Link', 500, errors)
  if (typeof link === 'string') {
    // Only real web links, so a saved link can never run code when clicked
    let isWebLink = false
    try {
      const url = new URL(link)
      isWebLink = url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      isWebLink = false
    }
    if (!isWebLink) {
      errors.push('Link must start with http:// or https://')
    }
  }
  data.link = link

  const appliedOn = readOptionalText(input.appliedOn, 'Applied date', 10, errors)
  if (typeof appliedOn === 'string') {
    const date = new Date(appliedOn + 'T00:00:00.000Z')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appliedOn) || Number.isNaN(date.getTime())) {
      errors.push('Applied date must look like 2026-01-31')
    } else {
      data.appliedOn = date
    }
  } else {
    data.appliedOn = appliedOn
  }

  return { data, errors }
}

// Sent with every internship: the stages it has entered, oldest first
const withHistory = {
  history: {
    select: { stage: true, changedAt: true },
    orderBy: { changedAt: 'asc' },
  },
} as const

// List: only this user's rows, newest first
internshipsRouter.get('/', async (_request, response) => {
  const internships = await prisma.internship.findMany({
    where: { userId: response.locals.userId },
    orderBy: { createdAt: 'desc' },
    include: withHistory,
  })
  response.json({ internships })
})

// Create: the owner is always the logged-in user, and the starting stage is logged
internshipsRouter.post('/', async (request, response) => {
  const { data, errors } = readInternship(request.body, false)

  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }

  let stage: InternshipStage = InternshipStage.APPLIED
  if (data.stage) {
    stage = data.stage
  }

  const internship = await prisma.internship.create({
    data: {
      company: data.company as string,
      role: data.role as string,
      stage,
      location: data.location,
      link: data.link,
      appliedOn: data.appliedOn,
      notes: data.notes,
      userId: response.locals.userId,
      history: { create: { stage } },
    },
    include: withHistory,
  })
  response.status(201).json({ internship })
})

// Edit: matching on id AND userId means someone else's id just isn't found
internshipsRouter.patch('/:id', async (request, response) => {
  const { data, errors } = readInternship(request.body, true)

  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }

  const existing = await prisma.internship.findFirst({
    where: { id: request.params.id, userId: response.locals.userId },
  })

  if (!existing) {
    response.status(404).json({ error: 'Internship not found' })
    return
  }

  // Only log a history row when the stage actually changes
  const changes: Parameters<typeof prisma.internship.update>[0]['data'] = { ...data }
  if (data.stage && data.stage !== existing.stage) {
    changes.history = { create: { stage: data.stage } }
  }

  const internship = await prisma.internship.update({
    where: { id: existing.id },
    data: changes,
    include: withHistory,
  })
  response.json({ internship })
})

internshipsRouter.delete('/:id', async (request, response) => {
  const result = await prisma.internship.deleteMany({
    where: { id: request.params.id, userId: response.locals.userId },
  })

  if (result.count === 0) {
    response.status(404).json({ error: 'Internship not found' })
    return
  }

  response.status(204).end()
})