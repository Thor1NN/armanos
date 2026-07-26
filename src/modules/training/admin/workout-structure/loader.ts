import 'server-only'

import type { Payload } from 'payload'
import type { ExerciseRow, LoadWorkoutStructureOutput } from './types'

const relationshipId = (relationship: number | { id: number }): number =>
  typeof relationship === 'object' ? relationship.id : relationship

export async function loadWorkoutStructure(
  payload: Payload,
  docId: number | string,
): Promise<LoadWorkoutStructureOutput> {
  const workout = await payload.findByID({ collection: 'workouts', id: docId, depth: 0 })

  const groupsResult = await payload.find({
    collection: 'workout-groups',
    where: { workout: { equals: docId } },
    sort: 'order',
    limit: 500,
    depth: 0,
  })

  const groupIds = groupsResult.docs.map((group) => group.id)

  const exerciseRowsResult = groupIds.length
    ? await payload.find({
        collection: 'workout-exercise-rows',
        where: { group: { in: groupIds } },
        sort: 'order',
        limit: 5000,
        depth: 1,
      })
    : { docs: [] }

  const exerciseRowIds = exerciseRowsResult.docs.map((exerciseRow) => exerciseRow.id)

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
      roundLogsResult.docs.map((roundLog) => relationshipId(roundLog.group)),
    ),
  ]

  const exerciseRowIdsWithLogs: number[] = [
    ...new Set(
      setLogsResult.docs
        .map((setLog) => setLog.exerciseRow)
        .filter((exerciseRow) => exerciseRow != null)
        .map((exerciseRow) => relationshipId(exerciseRow)),
    ),
  ]

  const sections = workout.sections ?? []

  const initialExerciseRows: ExerciseRow[] = exerciseRowsResult.docs.map(
    (exerciseRow) => ({
      ...exerciseRow,
      group: relationshipId(exerciseRow.group),
      exercise:
        exerciseRow.exercise && typeof exerciseRow.exercise === 'object'
          ? {
              id: exerciseRow.exercise.id,
              name: exerciseRow.exercise.name,
            }
          : null,
    }),
  )

  return {
    sections,
    initialGroups: groupsResult.docs,
    initialExerciseRows,
    groupIdsWithLogs,
    exerciseRowIdsWithLogs,
  }
}
