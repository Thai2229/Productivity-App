// Everything the Calendar page needs: talking to /api/events
import { apiRequest } from './api'

export type CalendarEvent = {
  id: string
  title: string
  description: string
  date: string
  createdAt: string
}

export type EventDraft = {
  title: string
  description: string
  date: string
}

export const MAX_TITLE = 120
export const MAX_DESCRIPTION = 2000

// Events between two days (inclusive), e.g. the six weeks shown for a month
export async function listEvents(from: string, to: string) {
  const query = '?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to)
  const data = await apiRequest<{ events: CalendarEvent[] }>('/api/events' + query, 'GET')
  return data.events
}

export async function createEvent(draft: EventDraft) {
  const data = await apiRequest<{ event: CalendarEvent }>('/api/events', 'POST', draft)
  return data.event
}

export async function updateEvent(id: string, changes: Partial<EventDraft>) {
  const data = await apiRequest<{ event: CalendarEvent }>('/api/events/' + id, 'PATCH', changes)
  return data.event
}

export async function deleteEvent(id: string) {
  await apiRequest<void>('/api/events/' + id, 'DELETE')
}
