import { getPayload } from 'payload'

import { STATUS_LABEL } from '@/types/constants'
import { buildExerciseMeta, workoutGroupLabel } from '@/lib/metrics'
import type { TPlanAccordionItem } from '@/types/plan'
import type { TBlock, TGroup, TWorkout } from '@/types/workout'

type Payload = Awaited<ReturnType<typeof getPayload>>

export type PlanLabels = {
  seriesPrefix: string
  repsPrefix: string
  durationPrefix: string
  restPrefix: string
}

export async function loadPlansItems(
  payload: Payload,
  planIds: (number | string)[],
  labels: PlanLabels,
  overrideAccess = false,
): Promise<TPlanAccordionItem[]> {
  if (!planIds.length) return []

  const plans = await payload.find({
    collection: 'plans',
    where: { id: { in: planIds } },
    sort: '-createdAt',
    depth: 0,
    limit: 100,
    overrideAccess,
  })

  if (!plans.docs.length) return []

  const microcycles = await payload.find({
    collection: 'microcycles',
    where: { plan: { in: planIds } },
    sort: 'order',
    depth: 0,
    limit: 500,
    overrideAccess,
  })

  const microcycleIds = microcycles.docs.map((m) => m.id)

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

  const workoutIds = workouts.docs.map((w) => w.id)

  const workoutGroups = workoutIds.length
    ? await payload.find({
        collection: 'workout-groups',
        where: { workout: { in: workoutIds } },
        sort: 'order',
        depth: 0,
        limit: 10000,
        overrideAccess,
      })
    : { docs: [] }

  const groupIds = workoutGroups.docs.map((g) => g.id)

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

  const resolveId = (rel: unknown): number | string | undefined =>
    rel && typeof rel === 'object' ? (rel as { id: number | string }).id : (rel as number | string)

  const microcyclesByPlan = (planId: number | string) =>
    microcycles.docs.filter((microcycle) => resolveId(microcycle.plan) === planId)
  const workoutsByMicrocycle = (microcycleId: number | string) =>
    workouts.docs.filter((workout) => resolveId(workout.microcycle) === microcycleId)
  const groupsByWorkout = (workoutId: number | string) =>
    workoutGroups.docs.filter((group) => resolveId(group.workout) === workoutId)
  const rowsByGroup = (groupId: number | string) =>
    exerciseRows.docs.filter((row) => resolveId(row.group) === groupId)

  const serializeWorkout = (workout: (typeof workouts.docs)[number]): TWorkout => {
    const sections = (workout.sections ?? []) as Array<{
      id?: string
      title?: string | null
      subtitle?: string | null
    }>
    const groups = groupsByWorkout(workout.id)

    const serializeGroup = (group: (typeof groups)[number]): TGroup => ({
      protocol: (group.protocol as string) ?? 'standard',
      label: workoutGroupLabel(group),
      exercises: rowsByGroup(group.id).map((ex) => {
        const cat =
          ex.exercise && typeof ex.exercise === 'object'
            ? (ex.exercise as {
                id: number
                name?: string
                trackingType?: string
                videoUrl?: string
              })
            : null
        const name = cat?.name || ex.note || ''
        const extraNote = cat && ex.note && ex.note !== cat.name ? ex.note : null
        return {
          rowId: String(ex.id),
          numer: (ex.numer as string | null) ?? null,
          name,
          note: extraNote as string | null,
          exerciseId: cat?.id ?? null,
          exerciseName: name,
          trackingType: cat?.trackingType ?? null,
          videoUrl: (cat?.videoUrl as string | null | undefined) ?? null,
          rounds: (ex.rounds as string | null) ?? null,
          meta: buildExerciseMeta(ex as Parameters<typeof buildExerciseMeta>[0], labels),
          prefill: {
            reps: (ex.reps as string | null) ?? null,
            rir: (ex.rir as string | null) ?? null,
          },
          setParameters:
            (ex.setParameters as
              | Array<{ setNumber: number; reps?: string | null; kg?: string | null }>
              | null
              | undefined) ?? null,
        }
      }),
    })

    return {
      id: workout.id,
      title: workout.title,
      rpe: workout.rpe ?? null,
      sections: sections.map((section) => {
        const sectionGroups = groups
          .filter((group) => (group.sectionRowId as string | null | undefined) === section.id)
          .sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0))
        // Bundle consecutive groups into colored blocks: a new block starts at
        // the first group of the section or whenever a group does not bundle
        // with the previous one. Block index resets per section.
        const blocks: TBlock[] = []
        sectionGroups.forEach((group, groupIndexInSection) => {
          if (groupIndexInSection === 0 || !group.bundleWithPrevious) {
            blocks.push({ index: blocks.length, groups: [] })
          }
          blocks[blocks.length - 1].groups.push(serializeGroup(group))
        })
        return {
          title: section.title ?? null,
          subtitle: section.subtitle ?? null,
          blocks,
        }
      }),
    }
  }

  return plans.docs.map((plan) => {
    const status = (plan.status as string) || 'active'
    return {
      id: plan.id,
      title: plan.title,
      status,
      statusLabel: STATUS_LABEL[status] || status,
      dateRange:
        plan.startDate || plan.endDate
          ? [plan.startDate, plan.endDate]
              .map((date) => (date ? new Date(date).toLocaleDateString('pl-PL') : '…'))
              .join(' – ')
          : null,
      description: plan.description ?? null,
      microcycles: microcyclesByPlan(plan.id).map((microcycle) => ({
        id: microcycle.id,
        title: microcycle.title,
        rpe: microcycle.rpe ?? null,
        workouts: workoutsByMicrocycle(microcycle.id).map((workout) => serializeWorkout(workout)),
      })),
    }
  })
}
