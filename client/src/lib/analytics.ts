import type { Internship, Stage } from './internships'

const DAY_MS = 24 * 60 * 60 * 1000

// Pipeline order used by the funnel (Rejected can happen after any step, so it's not here)
const PIPELINE: Stage[] = ['APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'FINAL_INTERVIEW', 'OFFER']

const STEP_LABELS = ['Applied', 'Screening', 'Early interviews', 'Final round', 'Offer']

function localDateKey(time: number) {
  const date = new Date(time)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return date.getFullYear() + '-' + month + '-' + day
}

// When the application was sent: the "Applied on" date if filled in, otherwise when it was added
function appliedTime(row: Internship) {
  if (row.appliedOn) {
    return Date.parse(row.appliedOn)
  }
  return Date.parse(row.createdAt)
}

// "Applied on" is a plain date, so use it as-is; otherwise use the local calendar day
function appliedDayKey(row: Internship) {
  if (row.appliedOn) {
    return row.appliedOn.slice(0, 10)
  }
  return localDateKey(Date.parse(row.createdAt))
}

export type ResponseStats = {
  averageDays: number | null
  responded: number
  total: number
}

// A response is the first time an application moved past Applied (including a rejection)
export function responseStats(rows: Internship[]): ResponseStats {
  let totalDays = 0
  let responded = 0

  for (const row of rows) {
    const reply = row.history.find((item) => item.stage !== 'APPLIED')
    if (!reply) {
      continue
    }
    const days = (Date.parse(reply.changedAt) - appliedTime(row)) / DAY_MS
    if (days >= 0) {
      totalDays += days
      responded += 1
    }
  }

  let averageDays: number | null = null
  if (responded > 0) {
    averageDays = totalDays / responded
  }
  return { averageDays, responded, total: rows.length }
}

export type ActivityStats = {
  total: number
  busiestDay: string | null
  busiestCount: number
  perDay: number
  perWeek: number
  perMonth: number
  perYear: number
}

export function activityStats(rows: Internship[]): ActivityStats {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = appliedDayKey(row)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let busiestDay: string | null = null
  let busiestCount = 0
  for (const [key, count] of counts) {
    // On a tie, the more recent day wins
    if (count > busiestCount || (count === busiestCount && busiestDay !== null && key > busiestDay)) {
      busiestDay = key
      busiestCount = count
    }
  }

  // Averages are spread over every day from the first application through today
  let perDay = 0
  if (rows.length > 0) {
    const firstKey = [...counts.keys()].sort()[0]
    const first = Date.parse(firstKey + 'T00:00:00')
    const today = Date.parse(localDateKey(Date.now()) + 'T00:00:00')
    const spanDays = Math.max(1, Math.round((today - first) / DAY_MS) + 1)
    perDay = rows.length / spanDays
  }

  return {
    total: rows.length,
    busiestDay,
    busiestCount,
    perDay,
    perWeek: perDay * 7,
    perMonth: perDay * (365.25 / 12),
    perYear: perDay * 365.25,
  }
}

export type FunnelStep = {
  label: string
  from: number
  to: number
  rate: number | null
}

// How far each application got. Reaching a later stage counts as passing the earlier ones.
function furthestIndex(row: Internship) {
  let furthest = 0
  const stages = row.history.map((item) => item.stage)
  stages.push(row.stage)
  for (const stage of stages) {
    const index = PIPELINE.indexOf(stage)
    if (index > furthest) {
      furthest = index
    }
  }
  return furthest
}

function rateOf(to: number, from: number) {
  if (from === 0) {
    return null
  }
  return to / from
}

export function funnelSteps(rows: Internship[]) {
  const reached = PIPELINE.map(() => 0)
  for (const row of rows) {
    const furthest = furthestIndex(row)
    for (let index = 0; index <= furthest; index++) {
      reached[index] += 1
    }
  }

  const steps: FunnelStep[] = []
  for (let index = 1; index < PIPELINE.length; index++) {
    steps.push({
      label: STEP_LABELS[index - 1] + ' → ' + STEP_LABELS[index],
      from: reached[index - 1],
      to: reached[index],
      rate: rateOf(reached[index], reached[index - 1]),
    })
  }

  const overall: FunnelStep = {
    label: 'Applied → Offer',
    from: reached[0],
    to: reached[PIPELINE.length - 1],
    rate: rateOf(reached[PIPELINE.length - 1], reached[0]),
  }

  return { steps, overall }
}
