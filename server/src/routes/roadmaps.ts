import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { perUserLimit, requireUser } from '../lib/session.js'
import { SkillStatus } from '../../generated/prisma/client.js'

export const roadmapsRouter = Router()

// Logged-in users only, and at most 120 requests a minute each
roadmapsRouter.use(requireUser)
roadmapsRouter.use(perUserLimit())

const STATUSES = Object.values(SkillStatus)
const MAX_ROADMAPS = 20
const MAX_SKILLS = 200
const MAX_COORD = 100000

function readName(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > 60) {
    errors.push(label + ' is required (up to 60 characters)')
    return undefined
  }
  return value.trim()
}

function readCoord(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > MAX_COORD) {
    errors.push(label + ' must be a number')
    return undefined
  }
  return value
}

type SkillInput = { name?: string; status?: SkillStatus; x?: number; y?: number }

// With partial = true (editing), any field may be left out
function readSkill(body: unknown, partial: boolean) {
  const errors: string[] = []
  const data: SkillInput = {}
  const input = (body ?? {}) as Record<string, unknown>

  if (input.name !== undefined || !partial) {
    data.name = readName(input.name, 'Skill name', errors)
  }
  if (input.status !== undefined) {
    if (typeof input.status !== 'string' || !STATUSES.includes(input.status as SkillStatus)) {
      errors.push('Status is not valid')
    } else {
      data.status = input.status as SkillStatus
    }
  }
  if (input.x !== undefined || !partial) {
    data.x = readCoord(input.x, 'x', errors)
  }
  if (input.y !== undefined || !partial) {
    data.y = readCoord(input.y, 'y', errors)
  }
  return { data, errors }
}

// Finds a roadmap only if it belongs to the logged-in user
function findOwnRoadmap(id: string, userId: string) {
  return prisma.roadmap.findFirst({ where: { id, userId } })
}

const skillFields = { id: true, name: true, status: true, x: true, y: true } as const
const linkFields = { id: true, fromId: true, toId: true } as const

// ---- Roadmaps ----

roadmapsRouter.get('/', async (_request, response) => {
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: response.locals.userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  })
  response.json({ roadmaps })
})

roadmapsRouter.post('/', async (request, response) => {
  const errors: string[] = []
  const name = readName(request.body?.name, 'Roadmap name', errors)
  if (errors.length > 0 || !name) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }
  const count = await prisma.roadmap.count({ where: { userId: response.locals.userId } })
  if (count >= MAX_ROADMAPS) {
    response.status(400).json({ error: 'You can have up to ' + MAX_ROADMAPS + ' roadmaps' })
    return
  }
  const roadmap = await prisma.roadmap.create({
    data: { name, userId: response.locals.userId },
    select: { id: true, name: true },
  })
  response.status(201).json({ roadmap })
})

// One roadmap with all its skills and arrows
roadmapsRouter.get('/:id', async (request, response) => {
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: request.params.id, userId: response.locals.userId },
    select: {
      id: true,
      name: true,
      skills: { select: skillFields, orderBy: { createdAt: 'asc' } },
      links: { select: linkFields },
    },
  })
  if (!roadmap) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  response.json({ roadmap })
})

roadmapsRouter.patch('/:id', async (request, response) => {
  const errors: string[] = []
  const name = readName(request.body?.name, 'Roadmap name', errors)
  const existing = await findOwnRoadmap(request.params.id, response.locals.userId)
  if (!existing) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  if (errors.length > 0 || !name) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }
  const roadmap = await prisma.roadmap.update({
    where: { id: existing.id },
    data: { name },
    select: { id: true, name: true },
  })
  response.json({ roadmap })
})

// Deleting a roadmap also deletes its skills and arrows
roadmapsRouter.delete('/:id', async (request, response) => {
  const result = await prisma.roadmap.deleteMany({
    where: { id: request.params.id, userId: response.locals.userId },
  })
  if (result.count === 0) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  response.status(204).end()
})

// ---- Skills ----

roadmapsRouter.post('/:id/skills', async (request, response) => {
  const roadmap = await findOwnRoadmap(request.params.id, response.locals.userId)
  if (!roadmap) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  const { data, errors } = readSkill(request.body, false)
  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }
  const count = await prisma.skill.count({ where: { roadmapId: roadmap.id } })
  if (count >= MAX_SKILLS) {
    response.status(400).json({ error: 'A roadmap can have up to ' + MAX_SKILLS + ' skills' })
    return
  }
  const skill = await prisma.skill.create({
    data: {
      name: data.name as string,
      status: data.status,
      x: data.x as number,
      y: data.y as number,
      roadmapId: roadmap.id,
    },
    select: skillFields,
  })
  response.status(201).json({ skill })
})

// Saves many block positions at once (used by Auto arrange)
roadmapsRouter.put('/:id/positions', async (request, response) => {
  const roadmap = await findOwnRoadmap(request.params.id, response.locals.userId)
  const positions = request.body?.positions
  if (!roadmap) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  if (!Array.isArray(positions) || positions.length > MAX_SKILLS) {
    response.status(400).json({ error: 'Positions are not valid' })
    return
  }
  const errors: string[] = []
  const updates: { id: string; x: number; y: number }[] = []
  for (const item of positions) {
    const x = readCoord(item?.x, 'x', errors)
    const y = readCoord(item?.y, 'y', errors)
    if (typeof item?.id === 'string' && x !== undefined && y !== undefined) {
      updates.push({ id: item.id, x, y })
    } else {
      errors.push('Position is not valid')
    }
  }
  if (errors.length > 0) {
    response.status(400).json({ error: 'Positions are not valid' })
    return
  }
  // updateMany with roadmapId means another roadmap's skills can never be moved
  await prisma.$transaction(
    updates.map((item) =>
      prisma.skill.updateMany({ where: { id: item.id, roadmapId: roadmap.id }, data: { x: item.x, y: item.y } }),
    ),
  )
  response.status(204).end()
})

roadmapsRouter.patch('/:id/skills/:skillId', async (request, response) => {
  const roadmap = await findOwnRoadmap(request.params.id, response.locals.userId)
  if (!roadmap) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  const { data, errors } = readSkill(request.body, true)
  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }
  const where = { id: request.params.skillId, roadmapId: roadmap.id }
  const result = await prisma.skill.updateMany({ where, data })
  if (result.count === 0) {
    response.status(404).json({ error: 'Skill not found' })
    return
  }
  const skill = await prisma.skill.findFirst({ where, select: skillFields })
  response.json({ skill })
})

// Deleting a skill also deletes the arrows to and from it
roadmapsRouter.delete('/:id/skills/:skillId', async (request, response) => {
  const roadmap = await findOwnRoadmap(request.params.id, response.locals.userId)
  if (!roadmap) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  const result = await prisma.skill.deleteMany({ where: { id: request.params.skillId, roadmapId: roadmap.id } })
  if (result.count === 0) {
    response.status(404).json({ error: 'Skill not found' })
    return
  }
  response.status(204).end()
})

// ---- Arrows ----

roadmapsRouter.post('/:id/links', async (request, response) => {
  const roadmap = await findOwnRoadmap(request.params.id, response.locals.userId)
  if (!roadmap) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  const fromId = request.body?.fromId
  const toId = request.body?.toId
  if (typeof fromId !== 'string' || typeof toId !== 'string' || fromId === toId) {
    response.status(400).json({ error: 'An arrow needs two different skills' })
    return
  }
  // Both ends must be skills on this same roadmap
  const found = await prisma.skill.count({ where: { roadmapId: roadmap.id, id: { in: [fromId, toId] } } })
  if (found !== 2) {
    response.status(404).json({ error: 'Skill not found' })
    return
  }
  // Drawing the same arrow twice just returns the existing one
  const link = await prisma.skillLink.upsert({
    where: { fromId_toId: { fromId, toId } },
    create: { fromId, toId, roadmapId: roadmap.id },
    update: {},
    select: linkFields,
  })
  response.status(201).json({ link })
})

roadmapsRouter.delete('/:id/links/:linkId', async (request, response) => {
  const roadmap = await findOwnRoadmap(request.params.id, response.locals.userId)
  if (!roadmap) {
    response.status(404).json({ error: 'Roadmap not found' })
    return
  }
  const result = await prisma.skillLink.deleteMany({ where: { id: request.params.linkId, roadmapId: roadmap.id } })
  if (result.count === 0) {
    response.status(404).json({ error: 'Arrow not found' })
    return
  }
  response.status(204).end()
})
