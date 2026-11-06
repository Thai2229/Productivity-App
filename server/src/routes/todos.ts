import { Router } from 'express'
import { TodoStatus } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { perUserLimit, requireUser } from '../lib/session.js'

export const todosRouter = Router()

// Logged-in users only, and at most 120 requests a minute each
todosRouter.use(requireUser)
todosRouter.use(perUserLimit())

const MAX_TODOS = 500
const MAX_TITLE = 120
const MAX_DESCRIPTION = 2000
const STATUSES: string[] = Object.values(TodoStatus)

type TodoInput = {
  title?: string
  description?: string
  dueDate?: Date | null
  status?: TodoStatus
}

// A due date looks like 2026-11-20. Empty or null means "no due date".
function readDueDate(value: unknown): { ok: boolean; date: Date | null } {
  if (value === null || value === '') {
    return { ok: true, date: null }
  }
  if (typeof value !== 'string') {
    return { ok: false, date: null }
  }
  const date = new Date(value + 'T00:00:00.000Z')
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    date.getUTCFullYear() < 2000 ||
    date.getUTCFullYear() > 2100
  ) {
    return { ok: false, date: null }
  }
  return { ok: true, date }
}

// With partial = true (editing), any field may be left out
function readTodo(body: unknown, partial: boolean) {
  const errors: string[] = []
  const data: TodoInput = {}
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

  if (input.dueDate !== undefined) {
    const due = readDueDate(input.dueDate)
    if (!due.ok) {
      errors.push('Due date is not valid')
    } else {
      data.dueDate = due.date
    }
  }

  if (input.status !== undefined) {
    if (typeof input.status !== 'string' || !STATUSES.includes(input.status)) {
      errors.push('Status is not valid')
    } else {
      data.status = input.status as TodoStatus
    }
  }

  return { data, errors }
}

// Shape sent to the page: due date as a plain day string
function toJson(todo: {
  id: string
  title: string
  description: string
  dueDate: Date | null
  status: TodoStatus
  completedAt: Date | null
  createdAt: Date
}) {
  let dueDate: string | null = null
  if (todo.dueDate) {
    dueDate = todo.dueDate.toISOString().slice(0, 10)
  }
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    dueDate,
    status: todo.status,
    completedAt: todo.completedAt,
    createdAt: todo.createdAt,
  }
}

todosRouter.get('/', async (_request, response) => {
  const todos = await prisma.todo.findMany({
    where: { userId: response.locals.userId },
    orderBy: { createdAt: 'asc' },
  })
  response.json({ todos: todos.map(toJson) })
})

todosRouter.post('/', async (request, response) => {
  const { data, errors } = readTodo(request.body, false)

  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }

  const count = await prisma.todo.count({ where: { userId: response.locals.userId } })
  if (count >= MAX_TODOS) {
    response.status(400).json({ error: 'You can have up to ' + MAX_TODOS + ' tasks. Delete some old ones first.' })
    return
  }

  const todo = await prisma.todo.create({
    data: {
      title: data.title as string,
      description: data.description ?? '',
      dueDate: data.dueDate ?? null,
      userId: response.locals.userId,
    },
  })
  response.status(201).json({ todo: toJson(todo) })
})

// Edit a task, or move it between the current and past lists
todosRouter.patch('/:id', async (request, response) => {
  const { data, errors } = readTodo(request.body, true)

  if (errors.length > 0) {
    response.status(400).json({ error: errors.join('. ') })
    return
  }

  const existing = await prisma.todo.findFirst({
    where: { id: request.params.id, userId: response.locals.userId },
  })
  if (!existing) {
    response.status(404).json({ error: 'Task not found' })
    return
  }

  const changes: TodoInput & { completedAt?: Date | null } = { ...data }
  if (data.status === TodoStatus.PAST && existing.status !== TodoStatus.PAST) {
    changes.completedAt = new Date()
  }
  if (data.status === TodoStatus.CURRENT) {
    changes.completedAt = null
  }

  const todo = await prisma.todo.update({ where: { id: existing.id }, data: changes })
  response.json({ todo: toJson(todo) })
})

todosRouter.delete('/:id', async (request, response) => {
  const result = await prisma.todo.deleteMany({
    where: { id: request.params.id, userId: response.locals.userId },
  })

  if (result.count === 0) {
    response.status(404).json({ error: 'Task not found' })
    return
  }

  response.status(204).end()
})
