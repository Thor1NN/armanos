import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import {
  createClient,
  createCoach,
  createPlanChain,
  getTestPayload,
} from './helpers'

/**
 * Ownership is decided by the server from the authenticated user —
 * client-supplied ids must never grant access to another client's data.
 */
describe('authorization', () => {
  let payload: Payload
  let clientA: { id: number }
  let clientB: { id: number }
  let chainA: Awaited<ReturnType<typeof createPlanChain>>
  let sessionA: { id: number }

  beforeAll(async () => {
    payload = await getTestPayload()
    await createCoach(payload)
    clientA = await createClient(payload, 'Owner A')
    clientB = await createClient(payload, 'Intruder B')
    chainA = await createPlanChain(payload, clientA.id)
    sessionA = await payload.create({
      collection: 'workout-logs',
      data: { workout: chainA.workout.id, client: clientA.id },
    })
    await payload.create({
      collection: 'set-logs',
      data: {
        session: sessionA.id,
        client: clientA.id,
        exerciseRow: chainA.row.id,
        setNumber: 1,
        weightLeft: 60,
        repsLeft: '8',
      },
    })
  })

  it('hides another client’s workout logs and set logs', async () => {
    const logs = await payload.find({
      collection: 'workout-logs',
      where: { client: { equals: clientA.id } },
      overrideAccess: false,
      user: { ...clientB, collection: 'clients' },
    })
    expect(logs.docs).toHaveLength(0)

    const sets = await payload.find({
      collection: 'set-logs',
      where: { session: { equals: sessionA.id } },
      overrideAccess: false,
      user: { ...clientB, collection: 'clients' },
    })
    expect(sets.docs).toHaveLength(0)
  })

  it('blocks logging a set into someone else’s session', async () => {
    await expect(
      payload.create({
        collection: 'set-logs',
        data: { session: sessionA.id, exerciseRow: chainA.row.id, setNumber: 2, weightLeft: 100 },
        overrideAccess: false,
        user: { ...clientB, collection: 'clients' },
      }),
    ).rejects.toThrow(/someone else/i)
  })

  it('blocks opening a session for a workout outside the client’s plans', async () => {
    await expect(
      payload.create({
        collection: 'workout-logs',
        data: { workout: chainA.workout.id },
        overrideAccess: false,
        user: { ...clientB, collection: 'clients' },
      }),
    ).rejects.toThrow(/not part of your plan/i)
  })

  it('forces the client relation to the authenticated user on log writes', async () => {
    const chainB = await createPlanChain(payload, clientB.id)
    const doc = await payload.create({
      collection: 'workout-logs',
      // Client B tries to attribute the session to client A — must be ignored.
      data: { workout: chainB.workout.id, client: clientA.id },
      overrideAccess: false,
      user: { ...clientB, collection: 'clients' },
    })
    const owner = typeof doc.client === 'object' ? doc.client?.id : doc.client
    expect(owner).toBe(clientB.id)
  })

  it('keeps plan structure reads coach-only', async () => {
    await expect(
      payload.find({
        collection: 'workouts',
        overrideAccess: false,
        user: { ...clientB, collection: 'clients' },
      }),
    ).rejects.toThrow()
  })
})
