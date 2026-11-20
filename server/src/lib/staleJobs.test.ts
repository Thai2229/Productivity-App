import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseCutoff,
  shouldReject,
  rejectStaleJobs,
  type StaleJobInput,
  type StaleJobStore,
} from './staleJobs.js'

const TODAY = '2026-06-15'

function job(stage: string, appliedOn: string | Date | null, createdAt: string | Date = '2026-01-01T10:00:00.000Z'): StaleJobInput {
  return { stage, appliedOn, createdAt }
}

describe('parseCutoff (today is passed in; default is today in UTC)', () => {
  test('accepts a valid past day', () => {
    assert.deepEqual(parseCutoff('2026-03-01', TODAY), { ok: true, day: '2026-03-01' })
  })

  test('accepts today (boundary) but not tomorrow', () => {
    assert.deepEqual(parseCutoff('2026-06-15', TODAY), { ok: true, day: '2026-06-15' })
    const tomorrow = parseCutoff('2026-06-16', TODAY)
    assert.equal(tomorrow.ok, false)
  })

  test('trims surrounding whitespace', () => {
    assert.deepEqual(parseCutoff('  2026-03-01 \n', TODAY), { ok: true, day: '2026-03-01' })
  })

  test('accepts a leap day and rejects a non-leap one', () => {
    assert.deepEqual(parseCutoff('2024-02-29', TODAY), { ok: true, day: '2024-02-29' })
    assert.equal(parseCutoff('2025-02-29', TODAY).ok, false)
  })

  for (const bad of [
    '2026-02-31',
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-3-1',
    '03/01/2026',
    '2026-03-01T00:00:00Z',
    '20260301',
    '',
    '   ',
    'tomorrow',
    '2026-03-01; DROP TABLE internship',
  ]) {
    test('rejects malformed or impossible value ' + JSON.stringify(bad), () => {
      const result = parseCutoff(bad, TODAY)
      assert.equal(result.ok, false)
      if (!result.ok) {
        assert.equal(typeof result.error, 'string')
        assert.ok(result.error.length > 0)
      }
    })
  }

  for (const bad of [undefined, null, 20260301, true, {}, [], ['2026-03-01'], new Date('2026-03-01')]) {
    test('rejects non-string ' + Object.prototype.toString.call(bad), () => {
      assert.equal(parseCutoff(bad, TODAY).ok, false)
    })
  }

  test('error messages are clear and differ by cause', () => {
    const malformed = parseCutoff('nope', TODAY)
    const impossible = parseCutoff('2026-02-31', TODAY)
    const future = parseCutoff('2099-01-01', TODAY)
    assert.ok(!malformed.ok && /YYYY-MM-DD/.test(malformed.error))
    assert.ok(!impossible.ok && /real|valid|exist/i.test(impossible.error))
    assert.ok(!future.ok && /future/i.test(future.error))
  })

  test('without a second argument "today" is the current UTC day', () => {
    const now = new Date().toISOString().slice(0, 10)
    assert.deepEqual(parseCutoff(now), { ok: true, day: now })
    assert.equal(parseCutoff('2999-01-01').ok, false)
  })
})

describe('shouldReject', () => {
  const CUTOFF = '2026-03-01'

  for (const stage of ['APPLIED', 'SCREENING', 'EARLY_INTERVIEW', 'FINAL_INTERVIEW']) {
    test(stage + ' applied before the cutoff is selected', () => {
      assert.equal(shouldReject(job(stage, '2026-02-01'), CUTOFF), true)
    })
  }

  for (const stage of ['OFFER', 'REJECTED']) {
    test(stage + ' is never selected, even when old', () => {
      assert.equal(shouldReject(job(stage, '2020-01-01'), CUTOFF), false)
    })
  }

  test('unknown stage is not selected', () => {
    assert.equal(shouldReject(job('ARCHIVED', '2020-01-01'), CUTOFF), false)
  })

  test('applied exactly on the cutoff day is included', () => {
    assert.equal(shouldReject(job('APPLIED', '2026-03-01'), CUTOFF), true)
  })

  test('applied the day after the cutoff is not included', () => {
    assert.equal(shouldReject(job('APPLIED', '2026-03-02'), CUTOFF), false)
  })

  test('appliedOn as an ISO timestamp (what Prisma sends as JSON)', () => {
    assert.equal(shouldReject(job('APPLIED', '2026-03-01T00:00:00.000Z'), CUTOFF), true)
    assert.equal(shouldReject(job('APPLIED', '2026-03-02T00:00:00.000Z'), CUTOFF), false)
  })

  test('appliedOn as a Date object', () => {
    assert.equal(shouldReject(job('APPLIED', new Date('2026-03-01T00:00:00.000Z')), CUTOFF), true)
    assert.equal(shouldReject(job('APPLIED', new Date('2026-03-02T00:00:00.000Z')), CUTOFF), false)
  })

  test('null appliedOn falls back to createdAt (string and Date)', () => {
    assert.equal(shouldReject(job('APPLIED', null, '2026-02-10T12:00:00.000Z'), CUTOFF), true)
    assert.equal(shouldReject(job('APPLIED', null, new Date('2026-02-10T12:00:00.000Z')), CUTOFF), true)
    assert.equal(shouldReject(job('APPLIED', null, '2026-03-01T12:00:00.000Z'), CUTOFF), true)
    assert.equal(shouldReject(job('APPLIED', null, '2026-03-02T00:00:00.000Z'), CUTOFF), false)
  })

  test('appliedOn wins over createdAt when both exist', () => {
    // created long ago, but applied after the cutoff
    assert.equal(shouldReject(job('APPLIED', '2026-04-01', '2025-01-01T00:00:00.000Z'), CUTOFF), false)
    // created after the cutoff, but applied before it
    assert.equal(shouldReject(job('APPLIED', '2026-01-01', '2026-05-01T00:00:00.000Z'), CUTOFF), true)
  })

  test('compares UTC calendar days, not local time (late-night UTC job, any time zone)', () => {
    const original = process.env.TZ
    try {
      for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Auckland', 'Asia/Kolkata']) {
        process.env.TZ = tz
        // 23:59:59.999Z on the cutoff day is still the cutoff day
        assert.equal(shouldReject(job('APPLIED', '2026-03-01T23:59:59.999Z'), CUTOFF), true, tz)
        assert.equal(shouldReject(job('APPLIED', new Date('2026-03-01T23:59:59.999Z')), CUTOFF), true, tz)
        assert.equal(shouldReject(job('APPLIED', null, '2026-03-01T23:30:00.000Z'), CUTOFF), true, tz)
        // 00:00:00.000Z the next day is after it
        assert.equal(shouldReject(job('APPLIED', '2026-03-02T00:00:00.000Z'), CUTOFF), false, tz)
        assert.equal(shouldReject(job('APPLIED', new Date('2026-03-02T00:00:00.000Z')), CUTOFF), false, tz)
        // plain day strings are never shifted
        assert.equal(shouldReject(job('APPLIED', '2026-03-01'), CUTOFF), true, tz)
        assert.equal(shouldReject(job('APPLIED', '2026-03-02'), CUTOFF), false, tz)
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

type Row = StaleJobInput & { id: string; userId: string }

// In-memory fake of the database. Honours userId like the real store must.
function fakeStore(rows: Row[]) {
  const calls = { list: [] as string[], reject: [] as { userId: string; ids: string[] }[] }
  const history: { id: string; stage: string }[] = []
  const store: StaleJobStore = {
    async list(userId) {
      calls.list.push(userId)
      return rows.filter((row) => row.userId === userId)
    },
    async reject(userId, ids) {
      calls.reject.push({ userId, ids })
      for (const row of rows) {
        if (row.userId === userId && ids.includes(row.id)) {
          row.stage = 'REJECTED'
          history.push({ id: row.id, stage: 'REJECTED' })
        }
      }
    },
  }
  return { store, rows, calls, history }
}

describe('rejectStaleJobs', () => {
  const CUTOFF = '2026-03-01'

  test('rejects only active, old, own applications and reports count and ids', async () => {
    const { store, rows, calls } = fakeStore([
      { id: 'a', userId: 'me', ...job('APPLIED', '2026-01-10') },
      { id: 'b', userId: 'me', ...job('SCREENING', '2026-03-01') },
      { id: 'c', userId: 'me', ...job('FINAL_INTERVIEW', null, '2026-02-01T00:00:00.000Z') },
      { id: 'd', userId: 'me', ...job('APPLIED', '2026-03-02') },
      { id: 'e', userId: 'me', ...job('OFFER', '2025-01-01') },
      { id: 'f', userId: 'me', ...job('REJECTED', '2025-01-01') },
      { id: 'g', userId: 'someone-else', ...job('APPLIED', '2025-01-01') },
    ])

    const result = await rejectStaleJobs(store, 'me', CUTOFF)

    assert.equal(result.count, 3)
    assert.deepEqual([...result.ids].sort(), ['a', 'b', 'c'])
    assert.deepEqual(calls.list, ['me'])
    assert.equal(calls.reject.length, 1)
    assert.equal(calls.reject[0].userId, 'me')
    assert.deepEqual([...calls.reject[0].ids].sort(), ['a', 'b', 'c'])

    const stages = Object.fromEntries(rows.map((row) => [row.id, row.stage]))
    assert.deepEqual(stages, {
      a: 'REJECTED',
      b: 'REJECTED',
      c: 'REJECTED',
      d: 'APPLIED',
      e: 'OFFER',
      f: 'REJECTED',
      g: 'APPLIED',
    })
  })

  test('records one REJECTED history entry per moved application and none for untouched ones', async () => {
    const { store, history } = fakeStore([
      { id: 'a', userId: 'me', ...job('APPLIED', '2026-01-10') },
      { id: 'f', userId: 'me', ...job('REJECTED', '2025-01-01') },
      { id: 'g', userId: 'other', ...job('APPLIED', '2025-01-01') },
    ])
    await rejectStaleJobs(store, 'me', CUTOFF)
    assert.deepEqual(history, [{ id: 'a', stage: 'REJECTED' }])
  })

  test('nothing to move: count 0, empty ids, store.reject is not called', async () => {
    const { store, calls } = fakeStore([{ id: 'd', userId: 'me', ...job('APPLIED', '2026-03-02') }])
    const result = await rejectStaleJobs(store, 'me', CUTOFF)
    assert.deepEqual(result, { count: 0, ids: [] })
    assert.equal(calls.reject.length, 0)
  })

  test('user with no applications', async () => {
    const { store, calls } = fakeStore([{ id: 'g', userId: 'other', ...job('APPLIED', '2020-01-01') }])
    const result = await rejectStaleJobs(store, 'me', CUTOFF)
    assert.deepEqual(result, { count: 0, ids: [] })
    assert.equal(calls.reject.length, 0)
  })

  test('is idempotent: a second run moves nothing', async () => {
    const { store } = fakeStore([{ id: 'a', userId: 'me', ...job('APPLIED', '2026-01-10') }])
    assert.equal((await rejectStaleJobs(store, 'me', CUTOFF)).count, 1)
    assert.deepEqual(await rejectStaleJobs(store, 'me', CUTOFF), { count: 0, ids: [] })
  })

  test('a store failure propagates (route can answer 500)', async () => {
    const { store } = fakeStore([{ id: 'a', userId: 'me', ...job('APPLIED', '2026-01-10') }])
    store.reject = async () => {
      throw new Error('db down')
    }
    await assert.rejects(() => rejectStaleJobs(store, 'me', CUTOFF), /db down/)
  })

  test('handles 10,000 applications', async () => {
    const rows: Row[] = []
    for (let i = 0; i < 10000; i++) {
      rows.push({ id: 'r' + i, userId: 'me', ...job('APPLIED', i % 2 === 0 ? '2026-01-01' : '2026-09-01') })
    }
    const { store } = fakeStore(rows)
    const result = await rejectStaleJobs(store, 'me', CUTOFF)
    assert.equal(result.count, 5000)
    assert.equal(result.ids.length, 5000)
  })
})
