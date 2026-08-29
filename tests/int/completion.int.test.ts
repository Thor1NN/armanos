import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import {
  createClient,
  createPlanChain,
  getTestPayload,
  loginClient,
} from './helpers'

/**
 * Completing a workout is atomic and idempotent; a completed session becomes
 * read-only history for the client (only the note stays editable).
 */
describe('workout completion', () => {
  let payload: Payload
  let authedFetch: Awaited<ReturnType<typeof loginClient>>
  let otherFetch: Awaited<ReturnType<typeof loginClient>>
  let chain: Awaited<ReturnType<typeof createPlanChain>>
  let sessionId: number

  beforeAll(async () => {
    payload = await getTestPayload()
    const client = await createClient(payload, 'Finisher')
    const other = await createClient(payload, 'Other')
    await createPlanChain(payload, other.id)
    chain = await createPlanChain(payload, client.id)
    authedFetch = await loginClient(client.email as string)
    otherFetch = await loginClient(other.email as string)

    const res = await authedFetch('/api/workout-logs', {
      method: 'POST',
      body: JSON.stringify({ workout: chain.workout.id }),
    })
    sessionId = (await res.json()).doc.id

    await authedFetch('/api/set-logs/upsert', {
      method: 'POST',
      body: JSON.stringify({
        session: sessionId,
        exerciseRow: chain.row.id,
        setNumber: 1,
        weightLeft: 80,
        repsLeft: '5',
      }),
    })
  })

  it('another client cannot finish someone else’s session', async () => {
    const res = await otherFetch(`/api/workout-logs/${sessionId}/finish`, { method: 'POST' })
    expect(res.status).toBe(404)
  })

  it('is idempotent: double submission keeps one completion timestamp', async () => {
    const first = await authedFetch(`/api/workout-logs/${sessionId}/finish`, { method: 'POST' })
    expect(first.status).toBe(200)
    const firstDoc = (await first.json()).doc
    expect(firstDoc.completedAt).toBeTruthy()

    const second = await authedFetch(`/api/workout-logs/${sessionId}/finish`, { method: 'POST' })
    expect(second.status).toBe(200)
    const secondDoc = (await second.json()).doc
    expect(secondDoc.completedAt).toBe(firstDoc.completedAt)
  })

  it('blocks new/edited sets on a completed session', async () => {
    const res = await authedFetch('/api/set-logs/upsert', {
      method: 'POST',
      body: JSON.stringify({
        session: sessionId,
        exerciseRow: chain.row.id,
        setNumber: 2,
        weightLeft: 82.5,
      }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(String(body.message)).toMatch(/already completed/i)
  })

  it('blocks reopening or shifting times, but allows editing the note', async () => {
    const reopen = await authedFetch(`/api/workout-logs/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ startedAt: new Date('2020-01-01').toISOString() }),
    })
    expect(reopen.status).toBeGreaterThanOrEqual(400)

    const note = await authedFetch(`/api/workout-logs/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: 'felt strong' }),
    })
    expect(note.status).toBe(200)
    expect((await note.json()).doc.notes).toBe('felt strong')
  })
})
