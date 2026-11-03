import { stageLabel, type Internship, type Stage } from './internships'

// The chart has one extra box beyond the stages: still Applied, no answer yet
export type FlowNodeId = Stage | 'WAITING'

export type FlowLink = { source: FlowNodeId; target: FlowNodeId; value: number }

// Pipeline order. Rejected isn't here because it can happen after any step.
const ORDER: Stage[] = ['APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'FINAL_INTERVIEW', 'OFFER']

export function flowLabel(id: FlowNodeId) {
  if (id === 'WAITING') {
    return 'Waiting'
  }
  return stageLabel(id)
}

// The boxes one application passed through, left to right.
// Example: Applied → Screening → Rejected, or Applied → Waiting.
export function pathFor(internship: Internship): FlowNodeId[] {
  const visited = new Set<Stage>(internship.history.map((item) => item.stage))
  visited.add(internship.stage)
  visited.add('APPLIED')

  // If a stage was moved back (say Offer → Screening to fix a mistake), stop at the current one
  let lastIndex = ORDER.length - 1
  if (internship.stage !== 'REJECTED') {
    lastIndex = ORDER.indexOf(internship.stage)
  }

  const path: FlowNodeId[] = ORDER.filter(
    (stage, index) => visited.has(stage) && index <= lastIndex,
  )

  if (internship.stage === 'REJECTED') {
    path.push('REJECTED')
  } else if (path.length === 1) {
    path.push('WAITING')
  }

  return path
}

// Counts how many applications went along each arrow
export function buildFlowLinks(internships: Internship[]): FlowLink[] {
  const counts = new Map<string, FlowLink>()

  for (const internship of internships) {
    const path = pathFor(internship)

    for (let index = 1; index < path.length; index++) {
      const source = path[index - 1]
      const target = path[index]
      const key = source + '>' + target
      const existing = counts.get(key)

      if (existing) {
        existing.value += 1
      } else {
        counts.set(key, { source, target, value: 1 })
      }
    }
  }

  return [...counts.values()]
}