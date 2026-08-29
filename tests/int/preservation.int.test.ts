import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import {
  createClient,
  createPlanChain,
  getTestPayload,
  loginClient,
  PASSWORD,
  TEST_BASE_URL,
} from './helpers'

/**
 * Historical logs are never orphaned or overwritten: anything referenced by
 * logs must be archived, not deleted, and program edits leave logs intact.
 */
describe('historical-log preservation', () => {
  let payload: Payload
  let client: { id: number; email?: string | null }
  let chain: Awaited<ReturnType<typeof createPlanChain>>
  let exerciseId: number
  let setId: number

  beforeAll(async () => {
    payload = await getTestPayload()
    client = await createClient(payload, 'History Owner')
    chain = await createPlanChain(payload, client.id)
    const exercise = await payload.create({
      collection: 'exercises',
      data: { name: `Bench ${Date.now()}`, trackingType: 'strength' },
    })
    exerciseId = exercise.id
    await payload.update({
      collection: 'workout-exercise-rows',
      id: chain.row.id,
      data: { exercise: exerciseId },
    })
    const session = await payload.create({
      collection: 'workout-logs',
      data: { workout: chain.workout.id, client: client.id },
    })
    const set = await payload.create({
      collection: 'set-logs',
      data: {
        session: session.id,
        client: client.id,
        exercise: exerciseId,
        exerciseName: 'Bench press',
        exerciseRow: chain.row.id,
        setNumber: 1,
        weightLeft: 100,
        repsLeft: '3',
        rir: '2',
      },
    })
    setId = set.id
  })

  it('blocks deleting a workout, plan, and microcycle with logged sessions', async () => {
    await expect(
      payload.delete({ collection: 'workouts', id: chain.workout.id }),
    ).rejects.toThrow(/logged sessions/i)
    await expect(payload.delete({ collection: 'plans', id: chain.plan.id })).rejects.toThrow(
      /logged sessions/i,
    )
    await expect(
      payload.delete({ collection: 'microcycles', id: chain.microcycle.id }),
    ).rejects.toThrow(/logged sessions/i)
  })

  it('blocks deleting an exercise row and exercise referenced by logs', async () => {
    await expect(
      payload.delete({ collection: 'workout-exercise-rows', id: chain.row.id }),
    ).rejects.toThrow(/logged sets/i)
    await expect(payload.delete({ collection: 'exercises', id: exerciseId })).rejects.toThrow(
      /archived/i,
    )
  })

  it('blocks deleting a client with recorded workouts', async () => {
    await expect(payload.delete({ collection: 'clients', id: client.id })).rejects.toThrow(
      /archived/i,
    )
  })

  it('coach edits to the program never touch recorded logs', async () => {
    await payload.update({
      collection: 'workout-exercise-rows',
      id: chain.row.id,
      data: { kg: '999', repsLeft: '1', note: 'completely reprogrammed' },
    })
    const set = await payload.findByID({ collection: 'set-logs', id: setId, depth: 0 })
    expect(set.weightLeft).toBe(100)
    expect(set.repsLeft).toBe('3')
    expect(set.rir).toBe('2')
  })

  it('archived clients cannot log in', async () => {
    const archived = await createClient(payload, 'Archived Person')
    await loginClient(archived.email as string) // sanity: active login works
    await payload.update({
      collection: 'clients',
      id: archived.id,
      data: { status: 'archived' },
    })
    const res = await fetch(`${TEST_BASE_URL}/api/clients/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: archived.email, password: PASSWORD }),
    })
    expect(res.ok).toBe(false)
  })
})
