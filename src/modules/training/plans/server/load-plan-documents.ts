import 'server-only'

import type { getPayload } from 'payload'

import type { PlanDocuments } from '@/modules/training/plans'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

export async function loadPlanDocuments(
  payload: PayloadInstance,
  planIds: (number | string)[],
  overrideAccess = false,
): Promise<PlanDocuments> {
  if (!planIds.length) {
    return { plans: [], microcycles: [], workouts: [], groups: [], exerciseRows: [] }
  }

  const plans = await payload.find({
    collection: 'plans',
    where: { id: { in: planIds } },
    sort: '-createdAt',
    depth: 0,
    limit: 100,
    overrideAccess,
  })

  if (!plans.docs.length) {
    return { plans: [], microcycles: [], workouts: [], groups: [], exerciseRows: [] }
  }

  const microcycles = await payload.find({
    collection: 'microcycles',
    where: { plan: { in: planIds } },
    sort: 'order',
    depth: 0,
    limit: 500,
    overrideAccess,
  })
  const microcycleIds = microcycles.docs.map((microcycle) => microcycle.id)

  const workouts = microcycleIds.length
    ? await payload.find({
        collection: 'workouts',
        where: { microcycle: { in: microcycleIds } },
        sort: 'order',
        depth: 0,
        limit: 1000,
        overrideAccess,
      })
    : { docs: [] }
  const workoutIds = workouts.docs.map((workout) => workout.id)

  const groups = workoutIds.length
    ? await payload.find({
        collection: 'workout-groups',
        where: { workout: { in: workoutIds } },
        sort: 'order',
        depth: 0,
        limit: 10000,
        overrideAccess,
      })
    : { docs: [] }
  const groupIds = groups.docs.map((group) => group.id)

  const exerciseRows = groupIds.length
    ? await payload.find({
        collection: 'workout-exercise-rows',
        where: { group: { in: groupIds } },
        sort: 'order',
        depth: 1,
        limit: 10000,
        overrideAccess,
      })
    : { docs: [] }

  return {
    plans: plans.docs,
    microcycles: microcycles.docs,
    workouts: workouts.docs,
    groups: groups.docs,
    exerciseRows: exerciseRows.docs,
  }
}
