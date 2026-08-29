import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { createClient, createPlanChain, getTestPayload } from './helpers'

/** Server-side input validation and canonical units (kg, 0.25 steps). */
describe('set-log validation & unit handling', () => {
  let payload: Payload
  let sessionId: number
  let rowId: number
  let setNumber = 10

  const createSet = (data: Record<string, unknown>) =>
    payload.create({
      collection: 'set-logs',
      data: {
        session: sessionId,
        exerciseRow: rowId,
        setNumber: setNumber++,
        ...data,
      } as never,
    })

  beforeAll(async () => {
    payload = await getTestPayload()
    const client = await createClient(payload, 'Validation Client')
    const chain = await createPlanChain(payload, client.id)
    rowId = chain.row.id
    const session = await payload.create({
      collection: 'workout-logs',
      data: { workout: chain.workout.id, client: client.id },
    })
    sessionId = session.id
  })

  it('accepts weights on the 0.25 kg grid and rejects finer values', async () => {
    const ok = await createSet({ weightLeft: 62.25, repsLeft: '5' })
    expect(ok.weightLeft).toBe(62.25)
    await expect(createSet({ weightLeft: 60.1 })).rejects.toThrow(/invalid: Weight/i)
  })

  it('rejects negative weight', async () => {
    await expect(createSet({ weightLeft: -5 })).rejects.toThrow(/invalid: Weight/i)
  })

  it('requires reps to be non-negative integers', async () => {
    await expect(createSet({ repsLeft: '-3' })).rejects.toThrow(/invalid: Reps/i)
    await expect(createSet({ repsLeft: '8.5' })).rejects.toThrow(/invalid: Reps/i)
    const ok = await createSet({ repsLeft: '12' })
    expect(ok.repsLeft).toBe('12')
  })

  it('bounds RIR to 0–10', async () => {
    await expect(createSet({ rir: '11' })).rejects.toThrow(/invalid: RIR/i)
    await expect(createSet({ rir: '-1' })).rejects.toThrow(/invalid: RIR/i)
    const ok = await createSet({ rir: '7.5', repsLeft: '5' })
    expect(ok.rir).toBe('7.5')
  })

  it('rejects zero/negative set numbers and non-integers', async () => {
    await expect(
      payload.create({
        collection: 'set-logs',
        data: { session: sessionId, exerciseRow: rowId, setNumber: 0, weightLeft: 10 },
      }),
    ).rejects.toThrow(/invalid: Set number/i)
  })

  it('rejects negative duration and distance', async () => {
    await expect(createSet({ durationSec: -10 })).rejects.toThrow()
    await expect(createSet({ distanceM: -100 })).rejects.toThrow()
  })
})
