/**
 * Migracja danych: nested arrays → osobne kolekcje
 *
 * Co robi:
 * 1. Dla każdego Workout czyta sekcje i stare zagnieżdżone groups/exercises
 * 2. Tworzy rekordy WorkoutGroup i WorkoutExerciseRow
 * 3. Aktualizuje SetLog.workoutExerciseRow (relationship) na podstawie
 *    starego SetLog.workoutExerciseRowId (text)
 *
 * Uruchom PO `payload migrate` (nowe tabele muszą istnieć).
 * Uruchom PRZED usunięciem legacy pól z Workouts.sections.groups.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'

type LegacyExercise = {
  id?: string | null
  numer?: string | null
  exercise?: number | { id: number } | null
  note?: string | null
  reps?: string | null
  kg?: string | null
  tut?: string | null
  rir?: string | null
  rest?: string | null
  durationMin?: number | null
  durationSec?: number | null
  extra?: string | null
}

type LegacyGroup = {
  id?: string | null
  setType?: string | null
  exercises?: LegacyExercise[]
}

type LegacySection = {
  id?: string | null
  title?: string | null
  subtitle?: string | null
  groups?: LegacyGroup[]
}

const run = async () => {
  const payload = await getPayload({ config })

  // Sprawdź czy migracja już była uruchomiona
  const existingGroups = await payload.count({ collection: 'workout-groups', where: {} })
  if (existingGroups.totalDocs > 0) {
    payload.logger.warn(`Znaleziono ${existingGroups.totalDocs} istniejących WorkoutGroup — migracja już była uruchomiona?`)
    payload.logger.warn('Aby uruchomić ponownie, najpierw usuń rekordy z workout-groups i workout-exercise-rows.')
    process.exit(1)
  }

  // Pobierz wszystkie treningi ze starymi danymi (depth=2 żeby dostać exercises.exercise)
  const workouts = await payload.find({
    collection: 'workouts',
    limit: 1000,
    depth: 2,
  })

  payload.logger.info(`Znaleziono ${workouts.docs.length} treningów do migracji`)

  let totalGroups = 0
  let totalExerciseRows = 0

  // Mapa: stary exercise row ID → nowy WorkoutExerciseRow ID
  const rowIdMap = new Map<string, number>()

  for (const workout of workouts.docs) {
    const sections = (workout.sections ?? []) as LegacySection[]

    for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
      const section = sections[sectionIdx]!
      const groups = section.groups ?? []

      for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
        const group = groups[groupIdx]!

        const newGroup = await payload.create({
          collection: 'workout-groups',
          data: {
            workout: workout.id,
            sectionRowId: section.id ?? String(sectionIdx),
            order: groupIdx,
            protocol: 'standard',
            rounds: undefined,
          },
        })
        totalGroups++

        const exercises = group.exercises ?? []
        for (let exIdx = 0; exIdx < exercises.length; exIdx++) {
          const ex = exercises[exIdx]!

          const exerciseId =
            ex.exercise == null
              ? undefined
              : typeof ex.exercise === 'object'
                ? ex.exercise.id
                : ex.exercise

          const newRow = await payload.create({
            collection: 'workout-exercise-rows',
            data: {
              group: newGroup.id,
              order: exIdx,
              numer: ex.numer ?? undefined,
              exercise: exerciseId ?? undefined,
              note: ex.note ?? undefined,
              reps: ex.reps ?? undefined,
              kg: ex.kg ?? undefined,
              tut: ex.tut ?? undefined,
              rir: ex.rir ?? undefined,
              rest: ex.rest ?? undefined,
              durationMin: ex.durationMin ?? undefined,
              durationSec: ex.durationSec ?? undefined,
            },
          })
          totalExerciseRows++

          if (ex.id) {
            rowIdMap.set(String(ex.id), newRow.id)
          }
        }
      }
    }
  }

  payload.logger.info(`Utworzono: ${totalGroups} grup, ${totalExerciseRows} wierszy ćwiczeń`)
  payload.logger.info(`Mapa ID: ${rowIdMap.size} wpisów`)

  // Zaktualizuj SetLogi — przypisz workoutExerciseRow relationship
  if (rowIdMap.size === 0) {
    payload.logger.info('Brak mapowań ID — pomijam aktualizację SetLogów')
    process.exit(0)
  }

  const setLogs = await payload.find({
    collection: 'set-logs',
    limit: 10000,
    depth: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { workoutExerciseRowId: { exists: true } } as any,
  })

  payload.logger.info(`Znaleziono ${setLogs.docs.length} SetLogów do zaktualizowania`)

  let updatedSetLogs = 0
  let skippedSetLogs = 0

  for (const setLog of setLogs.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldRowId = (setLog as any).workoutExerciseRowId as string | null | undefined
    if (!oldRowId) {
      skippedSetLogs++
      continue
    }

    const newRowId = rowIdMap.get(oldRowId)
    if (!newRowId) {
      payload.logger.warn(`SetLog ${setLog.id}: brak mapowania dla rowId="${oldRowId}"`)
      skippedSetLogs++
      continue
    }

    await payload.update({
      collection: 'set-logs',
      id: setLog.id,
      data: { exerciseRow: newRowId },
    })
    updatedSetLogs++
  }

  payload.logger.info(`SetLogi: zaktualizowano ${updatedSetLogs}, pominięto ${skippedSetLogs}`)
  payload.logger.info('Migracja zakończona.')
  payload.logger.info('Następny krok: usuń legacy pola z Workouts.sections.groups i uruchom payload migrate:create + migrate')

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
