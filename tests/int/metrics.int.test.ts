import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import type { SetLog } from '../../src/payload-types'
import {
  detectPrs,
  estimateOneRepMax,
  exerciseRecords,
  sessionVolume,
} from '../../src/modules/training/logs/metrics'
import { createClient, getTestPayload, loginClient } from './helpers'

const set = (data: Partial<SetLog>): SetLog => data as SetLog

describe('strength metrics', () => {
  it('estimates 1RM with Epley and passes single reps through', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.7, 1)
    expect(estimateOneRepMax(0, 5)).toBe(0)
  })

  it('excludes warm-up sets from records and volume', () => {
    const sets = [
      set({ weightLeft: 200, repsLeft: '10', setType: 'warmup' }),
      set({ weightLeft: 100, repsLeft: '5', setType: 'normal' }),
      set({ weightLeft: 90, repsLeft: '8', setType: 'failure' }),
    ]
    const records = exerciseRecords(sets)
    expect(records.bestWeight).toBe(100)
    expect(sessionVolume(sets)).toBe(100 * 5 + 90 * 8)
  })

  it('detects weight/e1rm/volume PRs against history', () => {
    const history = [set({ weightLeft: 100, repsLeft: '5', setType: 'normal' })]
    const session = [set({ weightLeft: 102.5, repsLeft: '5', setType: 'normal' })]
    const prs = detectPrs(session, history)
    const kinds = prs.map((pr) => pr.kind).sort()
    expect(kinds).toEqual(['e1rm', 'volume', 'weight'])
    expect(prs.find((pr) => pr.kind === 'weight')?.previous).toBe(100)

    // Equal performance is not a PR.
    expect(detectPrs(history, history)).toHaveLength(0)
  })
})

describe('body measurements', () => {
  let payload: Payload
  let fetchA: Awaited<ReturnType<typeof loginClient>>
  let fetchB: Awaited<ReturnType<typeof loginClient>>
  let entryId: number

  beforeAll(async () => {
    payload = await getTestPayload()
    const clientA = await createClient(payload, 'Body A')
    const clientB = await createClient(payload, 'Body B')
    fetchA = await loginClient((clientA as { email?: string }).email as string)
    fetchB = await loginClient((clientB as { email?: string }).email as string)
  })

  it('logs a measurement with forced ownership and 0.25 kg validation', async () => {
    const bad = await fetchA('/api/body-measurements', {
      method: 'POST',
      body: JSON.stringify({ measuredAt: new Date().toISOString(), weightKg: 80.1 }),
    })
    expect(bad.status).toBeGreaterThanOrEqual(400)

    const res = await fetchA('/api/body-measurements', {
      method: 'POST',
      body: JSON.stringify({
        measuredAt: new Date().toISOString(),
        weightKg: 80.25,
        client: 999999, // forged — ignored
      }),
    })
    expect(res.status).toBe(201)
    entryId = (await res.json()).doc.id
  })

  it('is invisible to other clients', async () => {
    const list = await fetchB('/api/body-measurements?limit=50').then((r) => r.json())
    expect(list.totalDocs).toBe(0)
    const direct = await fetchB(`/api/body-measurements/${entryId}`)
    expect(direct.status).toBeGreaterThanOrEqual(403)
  })
})
