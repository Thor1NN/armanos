import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { assertTestDatabaseUrl } from './global-setup'
import { createClient, createPlanChain, getTestPayload, loginClient } from './helpers'

describe('test database guard', () => {
  it('accepts only local databases whose name marks them as test targets', () => {
    expect(() =>
      assertTestDatabaseUrl('postgresql://u:p@localhost:55432/training_test'),
    ).not.toThrow()
    expect(() =>
      assertTestDatabaseUrl('postgresql://u:p@127.0.0.1:5432/armanos_test'),
    ).not.toThrow()
    expect(() => assertTestDatabaseUrl('postgresql://u:p@localhost:5432/training')).toThrow(
      /must contain "test"/,
    )
    expect(() =>
      assertTestDatabaseUrl('postgresql://u:p@ep-neon.aws.neon.tech/neondb_test'),
    ).toThrow(/non-local host/)
    expect(() => assertTestDatabaseUrl('')).toThrow(/valid URL/)
  })
})

describe('completed sessions stay immutable for clients', () => {
  let payload: Payload
  let fetchA: Awaited<ReturnType<typeof loginClient>>
  let sessionId: number
  let setId: number
  let rowId: number

  beforeAll(async () => {
    payload = await getTestPayload()
    const client = await createClient(payload, 'Immutable Owner')
    const chain = await createPlanChain(payload, client.id)
    rowId = chain.row.id
    fetchA = await loginClient((client as { email?: string }).email as string)

    const created = await fetchA('/api/workout-logs', {
      method: 'POST',
      body: JSON.stringify({ workout: chain.workout.id }),
    })
    sessionId = (await created.json()).doc.id

    const set = await fetchA('/api/set-logs/upsert', {
      method: 'POST',
      body: JSON.stringify({
        session: sessionId,
        exerciseRow: chain.row.id,
        setNumber: 1,
        weightLeft: 60,
        repsLeft: '8',
      }),
    })
    setId = (await set.json()).doc.id

    const finish = await fetchA(`/api/workout-logs/${sessionId}/finish`, { method: 'POST' })
    expect(finish.status).toBe(200)
  })

  it('blocks deleting a set from a completed session', async () => {
    const res = await fetchA(`/api/set-logs/${setId}`, { method: 'DELETE' })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const stillThere = await fetchA(`/api/set-logs/${setId}`)
    expect(stillThere.status).toBe(200)
  })

  it('blocks deleting the completed session itself', async () => {
    const res = await fetchA(`/api/workout-logs/${sessionId}`, { method: 'DELETE' })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const stillThere = await fetchA(`/api/workout-logs/${sessionId}`)
    expect(stillThere.status).toBe(200)
  })

  it('rejects late set writes after completion', async () => {
    const res = await fetchA('/api/set-logs/upsert', {
      method: 'POST',
      body: JSON.stringify({ session: sessionId, exerciseRow: rowId, setNumber: 2, weightLeft: 60 }),
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const sets = await fetchA(`/api/set-logs?where[session][equals]=${sessionId}`).then((r) => r.json())
    expect(sets.totalDocs).toBe(1)
  })
})

describe('diary partial updates', () => {
  let payload: Payload
  let fetchA: Awaited<ReturnType<typeof loginClient>>

  beforeAll(async () => {
    payload = await getTestPayload()
    const client = await createClient(payload, 'Diary Patch Owner')
    fetchA = await loginClient((client as { email?: string }).email as string)
  })

  it('a note-only PATCH keeps the meal items and totals', async () => {
    const created = await fetchA('/api/diary-entries', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'meal',
        entryDate: new Date().toISOString(),
        items: [{ name: 'Oats', grams: 80, kcalPer100g: 379 }],
      }),
    })
    expect(created.status).toBe(201)
    const { doc } = await created.json()
    expect(doc.totalKcal).toBe(303)

    const patched = await fetchA(`/api/diary-entries/${doc.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ text: 'with cinnamon' }),
    })
    expect(patched.status).toBe(200)
    const after = (await patched.json()).doc
    expect(after.text).toBe('with cinnamon')
    expect(after.items).toHaveLength(1)
    expect(after.items[0].grams).toBe(80)
    expect(after.totalKcal).toBe(303)
  })

  it('an explicit empty items array still requires text', async () => {
    const created = await fetchA('/api/diary-entries', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'meal',
        entryDate: new Date().toISOString(),
        items: [{ name: 'Banana', grams: 120, kcalPer100g: 89 }],
      }),
    })
    const { doc } = await created.json()
    const cleared = await fetchA(`/api/diary-entries/${doc.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ items: [] }),
    })
    expect(cleared.status).toBeGreaterThanOrEqual(400)
  })
})
