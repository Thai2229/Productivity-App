// Everything the To-Do page needs: talking to /api/todos, sorting and due-date labels
import { apiRequest } from './api'
import { dayKey, shiftDay } from './habits'

export type TodoStatus = 'CURRENT' | 'PAST'

export type Todo = {
  id: string
  title: string
  description: string
  dueDate: string | null
  status: TodoStatus
  completedAt: string | null
  createdAt: string
}

export type TodoDraft = {
  title: string
  description: string
  dueDate: string | null
}

export const MAX_TITLE = 120
export const MAX_DESCRIPTION = 2000

export async function listTodos() {
  const data = await apiRequest<{ todos: Todo[] }>('/api/todos', 'GET')
  return data.todos
}

export async function createTodo(draft: TodoDraft) {
  const data = await apiRequest<{ todo: Todo }>('/api/todos', 'POST', draft)
  return data.todo
}

export async function updateTodo(id: string, changes: Partial<TodoDraft> & { status?: TodoStatus }) {
  const data = await apiRequest<{ todo: Todo }>('/api/todos/' + id, 'PATCH', changes)
  return data.todo
}

export async function deleteTodo(id: string) {
  await apiRequest<void>('/api/todos/' + id, 'DELETE')
}

// Current list: soonest due date first, tasks with no date at the bottom, then oldest first
export function sortCurrent(todos: Todo[]) {
  return [...todos].sort((a, b) => {
    if (a.dueDate !== b.dueDate) {
      if (a.dueDate === null) {
        return 1
      }
      if (b.dueDate === null) {
        return -1
      }
      return a.dueDate.localeCompare(b.dueDate)
    }
    return a.createdAt.localeCompare(b.createdAt)
  })
}

// Past list: most recently finished first
export function sortPast(todos: Todo[]) {
  return [...todos].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
}

function shortDate(key: string) {
  const date = new Date(key + 'T12:00:00')
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (date.getFullYear() !== new Date().getFullYear()) {
    options.year = 'numeric'
  }
  return date.toLocaleDateString(undefined, options)
}

// "Due Nov 12", "Due today", "Due tomorrow" or "Overdue · Nov 3".
// tone picks the badge color: overdue (red), soon (today/tomorrow) or normal.
export function dueLabel(dueDate: string, isPast: boolean) {
  const today = dayKey(new Date())
  if (!isPast && dueDate < today) {
    return { text: 'Overdue · ' + shortDate(dueDate), tone: 'overdue' }
  }
  if (!isPast && dueDate === today) {
    return { text: 'Due today', tone: 'soon' }
  }
  if (!isPast && dueDate === shiftDay(today, 1)) {
    return { text: 'Due tomorrow', tone: 'soon' }
  }
  return { text: 'Due ' + shortDate(dueDate), tone: 'normal' }
}

export function doneLabel(completedAt: string | null) {
  if (!completedAt) {
    return 'Done'
  }
  return 'Done ' + shortDate(dayKey(new Date(completedAt)))
}
