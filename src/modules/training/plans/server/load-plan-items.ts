import 'server-only'

import { getPayload } from 'payload'

import {
  buildExerciseMeta,
  buildWorkoutGroupMeta,
  formatWorkoutGroupLabel,
  STATUS_LABEL,
  type Block,
  type ExerciseMetaLabels,
  type Group,
  type Plan,
  type Workout,
} from '@/modules/training/plans'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

export async function loadPlanItems(
  payload: PayloadInstance,
  planIds: (number | string)[],
  labels: ExerciseMetaLabels,
  overrideAccess = false,
): Promise<Plan[]> {
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

  const serializeWorkout = (workout: (typeof workouts.docs)[number]): Workout => {
    const sections = workout.sections ?? []
    const groups = groupsByWorkout(workout.id)

    const serializeGroup = (group: (typeof groups)[number]): Group => {
      const groupMeta = buildWorkoutGroupMeta(group)

      return {
        protocol: group.protocol ?? 'standard',
        label: group.label ?? '',
        protocolLabel: formatWorkoutGroupLabel(group),
        meta: groupMeta,
        exercises: rowsByGroup(group.id).map((exerciseRow) => {
          const { exercise: exerciseRelationship, group: _group, ...exerciseData } = exerciseRow
          const catalogExercise =
            exerciseRelationship && typeof exerciseRelationship === 'object'
              ? exerciseRelationship
              : null

          return {
            ...exerciseData,
            exercise: catalogExercise,
            meta: buildExerciseMeta(exerciseRow, labels),
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
        const blocks: Block[] = []
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
    const status = plan.status ?? 'active'
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
