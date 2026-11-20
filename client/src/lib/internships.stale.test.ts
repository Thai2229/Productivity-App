import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { staleInternships, type Internship, type Stage } from './internships.ts'

let counter = 0
function make(stage: Stage, appliedOn: string | null, createdAt = '2026-01-01T10:00:00.000Z'): Internship {
  counter += 1
  return {
    id: 'id' + counter,
    company: 'Co',
    role: 'Intern',
    stage,
    location: null,
    link: null,
    appliedOn,
    notes: null,
    createdAt,
    updatedAt: createdAt,
    history: [],
  }
}

const CUTOFF = '2026-03-01'

describe('staleInternships', () => {
  test('empty list gives empty list', () => {
    assert.deepEqual(staleInternships([], CUTOFF), [])
  })

  for (const stage of ['APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'FINAL_INTERVIEW'] as Stage[]) {
    test(stage + ' applied before the cutoff is selected', () => {
      const item = make(stage, '2026-02-01')
      assert.deepEqual(staleInternships([item], CUTOFF), [item])
    })
  }

  for (const stage of ['OFFER', 'REJECTED'] as Stage[]) {
    test(stage + ' is never selected', () => {
      assert.deepEqual(staleInternships([make(stage, '2020-01-01')], CUTOFF), [])
    })
  }

  test('boundary: on the cutoff day is included, the day after is not', () => {
    const on = make('APPLIED', '2026-03-01')
    const after = make('APPLIED', '2026-03-02')
    assert.deepEqual(staleInternships([on, after], CUTOFF), [on])
  })

  test('appliedOn as an ISO timestamp (what the API returns)', () => {
    const on = make('APPLIED', '2026-03-01T00:00:00.000Z')
    const after = make('APPLIED', '2026-03-02T00:00:00.000Z')
    assert.deepEqual(staleInternships([on, after], CUTOFF), [on])
  })

  test('null appliedOn falls back to createdAt', () => {
    const old = make('APPLIED', null, '2026-02-10T12:00:00.000Z')
    const recent = make('APPLIED', null, '2026-03-05T12:00:00.000Z')
    assert.deepEqual(staleInternships([old, recent], CUTOFF), [old])
  })

  test('keeps the original order and does not change the input list', () => {
    const a = make('APPLIED', '2026-01-01')
    const skip = make('OFFER', '2026-01-01')
    const b = make('SCREENING', '2026-02-01')
    const list = [a, skip, b]
    const copy = [...list]
    assert.deepEqual(staleInternships(list, CUTOFF), [a, b])
    assert.deepEqual(list, copy)
    assert.equal(list[0].stage, 'APPLIED')
  })

  test('compares UTC days regardless of local time zone', () => {
    const original = process.env.TZ
    try {
      for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Auckland']) {
        process.env.TZ = tz
        const late = make('APPLIED', '2026-03-01T23:59:59.999Z')
        const next = make('APPLIED', '2026-03-02T00:00:00.000Z')
        const lateCreated = make('APPLIED', null, '2026-03-01T23:30:00.000Z')
        assert.deepEqual(staleInternships([late, next, lateCreated], CUTOFF), [late, lateCreated], tz)
      }
    } finally {
      if (original === undefined) {
        delete process.env.TZ
      } else {
        process.env.TZ = original
      }
    }
  })
})
