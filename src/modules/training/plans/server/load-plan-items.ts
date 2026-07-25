import 'server-only'

import { getPayload } from 'payload'

import {
  buildExerciseMeta,
  buildWorkoutGroupMeta,
  formatWorkoutGroupLabel,
  STATUS_LABEL,
  type TBlock,
  type TGroup,
  type PlanLabels,
  type TPlanAccordionItem,
  type TWorkout,
} from '@/modules/training/plans'

type Payload = Awaited<ReturnType<typeof getPayload>>

export async function loadPlanItems(
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

  const groupIds = workoutGroups.docs.map((group) => group.id)

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

  const resolveId = (relationship: unknown): number | string | undefined =>
    relationship && typeof relationship === 'object'
      ? (relationship as { id: number | string }).id
      : (relationship as number | string)

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

    const serializeGroup = (group: (typeof groups)[number]): TGroup => {
      const groupMeta = buildWorkoutGroupMeta(group)

      return {
        protocol: group.protocol ?? 'standard',
        label: (group.label as string | null) ?? '',
        protocolLabel: formatWorkoutGroupLabel(group),
        meta: groupMeta,
        exercises: rowsByGroup(group.id).map((exerciseRow) => {
          const catalogExercise =
            exerciseRow.exercise && typeof exerciseRow.exercise === 'object'
              ? (exerciseRow.exercise as {
                  id: number
                  name?: string
                  trackingType?: string
                  videoUrl?: string
                })
              : null
          const name = catalogExercise?.name || exerciseRow.note || ''
          const extraNote =
            catalogExercise && exerciseRow.note && exerciseRow.note !== catalogExercise.name
              ? exerciseRow.note
              : null
          return {
            rowId: String(exerciseRow.id),
            numer: (exerciseRow.numer as string | null) ?? null,
            name,
            note: extraNote as string | null,
            exerciseId: catalogExercise?.id ?? null,
            exerciseName: name,
            trackingType: catalogExercise?.trackingType ?? null,
            targetType:
              (exerciseRow.targetType as 'repetitions' | 'duration' | null) ?? 'repetitions',
            videoUrl: (catalogExercise?.videoUrl as string | null | undefined) ?? null,
            rounds: (exerciseRow.rounds as string | null) ?? null,
            meta: buildExerciseMeta(exerciseRow, labels),
            prefill: {
              repsLeft: (exerciseRow.repsLeft as string | null) ?? null,
              repsRight: (exerciseRow.repsRight as string | null) ?? null,
            },
            setParameters:
              (exerciseRow.setParameters as
                | Array<{ setNumber: number; reps?: string | null; kg?: string | null }>
                | null
                | undefined) ?? null,
          }
        }),
      }
    }

    return {
      id: workout.id,
      title: workout.title,
      rpe: workout.rpe ?? null,
      sections: sections.map((section) => {
        const sectionGroups = groups
          .filter((group) => (group.sectionRowId as string | null | undefined) === section.id)
          .sort(
            (firstGroup, secondGroup) =>
              ((firstGroup.order as number) ?? 0) - ((secondGroup.order as number) ?? 0),
          )
        /**
         * A new colored block starts at the first group or whenever a group does not
         * bundle with the previous one. The block index resets for every section.
         */
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
