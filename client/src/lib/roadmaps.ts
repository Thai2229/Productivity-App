// Everything the Roadmap page needs to talk to /api/roadmaps, plus Auto arrange

export type SkillStatus = 'LEARNED' | 'LEARNING' | 'PLANNED'

export type RoadmapSummary = { id: string; name: string }
export type Skill = { id: string; name: string; status: SkillStatus; x: number; y: number }
export type SkillLink = { id: string; fromId: string; toId: string }
export type RoadmapDetail = RoadmapSummary & { skills: Skill[]; links: SkillLink[] }

export const STATUSES: { value: SkillStatus; label: string }[] = [
  { value: 'LEARNED', label: 'Learned' },
  { value: 'LEARNING', label: 'Learning' },
  { value: 'PLANNED', label: 'Planned' },
]

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const options: RequestInit = { method, headers: {} }

  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch('/api/roadmaps' + path, options)

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

export async function listRoadmaps() {
  const data = await request<{ roadmaps: RoadmapSummary[] }>('', 'GET')
  return data.roadmaps
}

export async function getRoadmap(id: string) {
  const data = await request<{ roadmap: RoadmapDetail }>('/' + id, 'GET')
  return data.roadmap
}

export async function createRoadmap(name: string) {
  const data = await request<{ roadmap: RoadmapSummary }>('', 'POST', { name })
  return data.roadmap
}

export async function renameRoadmap(id: string, name: string) {
  const data = await request<{ roadmap: RoadmapSummary }>('/' + id, 'PATCH', { name })
  return data.roadmap
}

export async function deleteRoadmap(id: string) {
  await request<void>('/' + id, 'DELETE')
}

export async function createSkill(roadmapId: string, skill: Omit<Skill, 'id'>) {
  const data = await request<{ skill: Skill }>('/' + roadmapId + '/skills', 'POST', skill)
  return data.skill
}

export async function updateSkill(roadmapId: string, id: string, changes: Partial<Omit<Skill, 'id'>>) {
  const data = await request<{ skill: Skill }>('/' + roadmapId + '/skills/' + id, 'PATCH', changes)
  return data.skill
}

export async function deleteSkill(roadmapId: string, id: string) {
  await request<void>('/' + roadmapId + '/skills/' + id, 'DELETE')
}

export async function savePositions(roadmapId: string, positions: { id: string; x: number; y: number }[]) {
  await request<void>('/' + roadmapId + '/positions', 'PUT', { positions })
}

export async function createLink(roadmapId: string, fromId: string, toId: string) {
  const data = await request<{ link: SkillLink }>('/' + roadmapId + '/links', 'POST', { fromId, toId })
  return data.link
}

export async function deleteLink(roadmapId: string, id: string) {
  await request<void>('/' + roadmapId + '/links/' + id, 'DELETE')
}

const COLUMN_GAP = 280
const ROW_GAP = 110

// Lays skills out left to right: a skill sits one column after everything that points to it
export function autoArrange(skills: Skill[], links: SkillLink[]) {
  const column = new Map<string, number>()
  for (const skill of skills) {
    column.set(skill.id, 0)
  }

  // Repeat enough times for the longest chain; the cap also stops loops (A → B → A) going forever
  for (let round = 0; round < skills.length; round++) {
    let changed = false
    for (const link of links) {
      const from = column.get(link.fromId)
      const to = column.get(link.toId)
      if (from !== undefined && to !== undefined && to < from + 1 && from + 1 < skills.length) {
        column.set(link.toId, from + 1)
        changed = true
      }
    }
    if (!changed) {
      break
    }
  }

  // Within a column, keep the current top-to-bottom order
  const byColumn = new Map<number, Skill[]>()
  for (const skill of skills) {
    const index = column.get(skill.id) ?? 0
    const list = byColumn.get(index) ?? []
    list.push(skill)
    byColumn.set(index, list)
  }

  const positions: { id: string; x: number; y: number }[] = []
  for (const [index, list] of byColumn) {
    list.sort((a, b) => a.y - b.y)
    list.forEach((skill, row) => {
      positions.push({ id: skill.id, x: index * COLUMN_GAP, y: row * ROW_GAP })
    })
  }
  return positions
}
