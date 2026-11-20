// Moves applications still in progress to Rejected once they are older than a cutoff day.
// All comparisons use UTC calendar days (YYYY-MM-DD strings).

export const ACTIVE_STAGES = ['APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'FINAL_INTERVIEW']

export type CutoffResult = { ok: true; day: string } | { ok: false; error: string }

export type StaleJobInput = {
  stage: string
  appliedOn: string | Date | null
  createdAt: string | Date
}

export type StaleJobStore = {
  // Every application belonging to userId (and nobody else's)
  list(userId: string): Promise<(StaleJobInput & { id: string })[]>
  // Sets stage REJECTED and adds one REJECTED stage-history row per id, all or nothing.
  // Must only touch rows owned by userId.
  reject(userId: string, ids: string[]): Promise<void>
}

export function parseCutoff(input: unknown, today?: string): CutoffResult {
  const todayDay = today ?? new Date().toISOString().slice(0, 10)

  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return { ok: false, error: 'Date must look like 2026-01-31 (YYYY-MM-DD)' }
  }
  const day = input.trim()

  const parsed = new Date(day + 'T00:00:00.000Z')
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) {
    return { ok: false, error: 'Date must be a real calendar day' }
  }
  if (day > todayDay) {
    return { ok: false, error: 'Date cannot be in the future' }
  }
  return { ok: true, day }
}

function dayOf(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

export function shouldReject(job: StaleJobInput, cutoffDay: string): boolean {
  if (!ACTIVE_STAGES.includes(job.stage)) {
    return false
  }
  return dayOf(job.appliedOn ?? job.createdAt) <= cutoffDay
}

export async function rejectStaleJobs(
  store: StaleJobStore,
  userId: string,
  cutoffDay: string,
): Promise<{ count: number; ids: string[] }> {
  const rows = await store.list(userId)
  const ids = rows.filter((row) => shouldReject(row, cutoffDay)).map((row) => row.id)

  if (ids.length > 0) {
    await store.reject(userId, ids)
  }
  return { count: ids.length, ids }
}
