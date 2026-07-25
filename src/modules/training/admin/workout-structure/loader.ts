import 'server-only'

import type { ExerciseRow, Group, RawExerciseRow, Section, WorkoutStructureData } from './types'

export async function loadWorkoutStructure(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  docId: number | string,
): Promise<WorkoutStructureData> {
  const workout = await payload.findByID({ collection: 'workouts', id: docId, depth: 0 })

  const groupsResult = await payload.find({
    collection: 'workout-groups',
    where: { workout: { equals: docId } },
    sort: 'order',
    limit: 500,
    depth: 0,
  })

  const groupIds = groupsResult.docs.map((group: Group) => group.id)

  const exerciseRowsResult = groupIds.length
    ? await payload.find({
        collection: 'workout-exercise-rows',
        where: { group: { in: groupIds } },
        sort: 'order',
        limit: 5000,
        depth: 1,
      })
    : { docs: [] }

  const exerciseRowIds = exerciseRowsResult.docs.map(
    (exerciseRow: RawExerciseRow) => exerciseRow.id,
  )

  const [roundLogsResult, setLogsResult] = await Promise.all([
    groupIds.length
      ? payload.find({
          collection: 'round-logs',
          where: { group: { in: groupIds } },
          limit: 5000,
          depth: 0,
        })
      : { docs: [] },
    exerciseRowIds.length
      ? payload.find({
          collection: 'set-logs',
          where: { exerciseRow: { in: exerciseRowIds } },
          limit: 5000,
          depth: 0,
        })
      : { docs: [] },
  ])

  const groupIdsWithLogs: number[] = [
    ...new Set(
      roundLogsResult.docs.map((roundLog: { group: number | { id: number } }) =>
        typeof roundLog.group === 'object' ? roundLog.group.id : roundLog.group
      ) as number[],
    ),
  ]

  const exerciseRowIdsWithLogs: number[] = [
    ...new Set(
      setLogsResult.docs.map((setLog: { exerciseRow: number | { id: number } }) =>
        typeof setLog.exerciseRow === 'object' ? setLog.exerciseRow.id : setLog.exerciseRow
      ) as number[],
    ),
  ]

  const sections: Section[] = (workout.sections ?? []) as Section[]

  const initialGroups: Group[] = groupsResult.docs.map((group: Group) => ({
    id: group.id,
    sectionRowId: group.sectionRowId ?? null,
    order: group.order ?? 0,
    label: group.label ?? null,
    bundleWithPrevious: group.bundleWithPrevious ?? false,
    protocol: group.protocol ?? 'standard',
    rounds: group.rounds ?? null,
    durationMinutes: group.durationMinutes ?? null,
    intervalSeconds: group.intervalSeconds ?? null,
    workSeconds: group.workSeconds ?? null,
    restSeconds: group.restSeconds ?? null,
    restBetweenRounds: group.restBetweenRounds ?? null,
  }))

  const initialExerciseRows: ExerciseRow[] = exerciseRowsResult.docs.map(
    (exerciseRow: RawExerciseRow) => ({
      id: exerciseRow.id,
      group:
        typeof exerciseRow.group === 'object' && exerciseRow.group !== null
          ? exerciseRow.group.id
          : (exerciseRow.group ?? null),
      order: exerciseRow.order ?? 0,
      numer: exerciseRow.numer ?? null,
      rounds: exerciseRow.rounds ?? null,
      exercise:
        exerciseRow.exercise && typeof exerciseRow.exercise === 'object'
          ? {
              id: (exerciseRow.exercise as { id: number }).id,
              name: (exerciseRow.exercise as { name?: string | null }).name ?? null,
            }
          : null,
      note: exerciseRow.note ?? null,
      targetType:
        (exerciseRow as { targetType?: 'repetitions' | 'duration' | null }).targetType ??
        'repetitions',
      reps: exerciseRow.reps ?? null,
      repsLeft: exerciseRow.repsLeft ?? null,
      repsRight: exerciseRow.repsRight ?? null,
      kg: exerciseRow.kg ?? null,
      tut: exerciseRow.tut ?? null,
      rir: exerciseRow.rir ?? null,
      rest: exerciseRow.rest ?? null,
      durationMin: exerciseRow.durationMin ?? null,
      durationSec: exerciseRow.durationSec ?? null,
    }),
  )

  return { sections, initialGroups, initialExerciseRows, groupIdsWithLogs, exerciseRowIdsWithLogs }
}
