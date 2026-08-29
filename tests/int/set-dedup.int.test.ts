import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import {
  createClient,
  createPlanChain,
  getTestPayload,
  loginClient,
} from './helpers'

/**
 * The autosave path must be idempotent: one row per
 * (session, exerciseRow, setNumber), enforced by the upsert endpoint and
 * backstopped by the unique DB index.
 */
describe('set upsert & deduplication', () => {
  let payload: Payload
  let authedFetch: Awaited<ReturnType<typeof loginClient>>
  let chain: Awaited<ReturnType<typeof createPlanChain>>
  let sessionId: number

  beforeAll(async () => {
    payload = await getTestPayload()
    const client = await createClient(payload, 'Upsert Client')
    chain = await createPlanChain(payload, client.id)
    authedFetch = await loginClient(client.email as string)

    const res = await authedFetch('/api/workout-logs', {
      method: 'POST',
      body: JSON.stringify({ workout: chain.workout.id }),
    })
    expect(res.status).toBe(201)
    sessionId = (await res.json()).doc.id
  })

  it('creates on first save and updates on retries of the same set number', async () => {
    const body = {
      session: sessionId,
      exerciseRow: chain.row.id,
      setNumber: 1,
      weightLeft: 60,
      repsLeft: '8',
    }
    const first = await authedFetch('/api/set-logs/upsert', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    expect(first.status).toBe(201)
    const firstDoc = (await first.json()).doc

    const second = await authedFetch('/api/set-logs/upsert', {
      method: 'POST',
      body: JSON.stringify({ ...body, weightLeft: 62.5, repsLeft: '7' }),
    })
    expect(second.status).toBe(200)
    const secondDoc = (await second.json()).doc

    expect(secondDoc.id).toBe(firstDoc.id)
    expect(secondDoc.weightLeft).toBe(62.5)

    const rows = await payload.find({
      collection: 'set-logs',
      where: {
        and: [
          { session: { equals: sessionId } },
          { exerciseRow: { equals: chain.row.id } },
          { setNumber: { equals: 1 } },
        ],
      },
    })
    expect(rows.totalDocs).toBe(1)
  })

  it('rejects a raw duplicate insert at the database level', async () => {
    await payload.create({
      collection: 'set-logs',
      data: { session: sessionId, exerciseRow: chain.row.id, setNumber: 5, weightLeft: 40 },
    })
    await expect(
      payload.create({
        collection: 'set-logs',
        data: { session: sessionId, exerciseRow: chain.row.id, setNumber: 5, weightLeft: 41 },
      }),
    ).rejects.toThrow()
  })

  it('requires the composite key', async () => {
    const res = await authedFetch('/api/set-logs/upsert', {
      method: 'POST',
      body: JSON.stringify({ session: sessionId, weightLeft: 10 }),
    })
    expect(res.status).toBe(400)
  })
})
