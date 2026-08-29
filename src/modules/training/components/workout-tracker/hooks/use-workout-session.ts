'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { sdk } from '@/lib/sdk'
import type { MetricField } from '@/modules/training/exercises'
import {
  getExerciseName,
  type WorkoutExerciseTree,
  type WorkoutTree,
} from '@/modules/training/plans'
import { toSetLogMetricData, type MetricFormValues } from '@/modules/training/logs'
import type { ExerciseLog, SetLog, WorkoutLog } from '@/payload-types'

const relationshipId = (
  relationship: number | { id: number } | null | undefined,
): number | null =>
  relationship && typeof relationship === 'object' ? relationship.id : (relationship ?? null)

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = (await res.json().catch(() => null)) as { message?: string } | null
  if (!res.ok) {
    throw new Error(json?.message ?? `Request failed (${res.status})`)
  }
  return json as T
}

export function useWorkoutSession(
  workout: WorkoutTree,
  options: { readOnly?: boolean; showResults?: boolean },
) {
  const { readOnly, showResults } = options
  const t = useTranslations('session')

  const [session, setSession] = useState<WorkoutLog | null>(null)
  const [sets, setSets] = useState<SetLog[]>([])
  const [prevSets, setPrevSets] = useState<SetLog[]>([])
  const [exerciseNotes, setExerciseNotes] = useState<ExerciseLog[]>([])
  const [loadedWorkoutId, setLoadedWorkoutId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingSaves, setPendingSaves] = useState(0)
  const [lastSaveFailed, setLastSaveFailed] = useState(false)
  const [hasSavedOnce, setHasSavedOnce] = useState(false)

  const hasLoaded = loadedWorkoutId === workout.id
  const displayedSession = hasLoaded ? session : null
  const displayedSets = hasLoaded ? sets : []
  const displayedNotes = hasLoaded ? exerciseNotes : []
  const sessionCompleted = Boolean(displayedSession?.completedAt)

  const saveStatus: SaveStatus =
    pendingSaves > 0 ? 'saving' : lastSaveFailed ? 'failed' : hasSavedOnce ? 'saved' : 'idle'

  useEffect(() => {
    if (readOnly && !showResults) return
    let active = true

    const load = async () => {
      // Resume only an unfinished session; completed ones are history.
      const [openResult, lastCompletedResult] = await Promise.all([
        sdk.find({
          collection: 'workout-logs',
          where: {
            and: [{ workout: { equals: workout.id } }, { completedAt: { exists: false } }],
          },
          limit: 1,
          depth: 0,
          sort: '-updatedAt',
        }),
        sdk.find({
          collection: 'workout-logs',
          where: {
            and: [{ workout: { equals: workout.id } }, { completedAt: { exists: true } }],
          },
          limit: 1,
          depth: 0,
          sort: '-completedAt',
        }),
      ])
      if (!active) return

      // In the read-only share view there is no "open" session to resume —
      // show the latest session (completed or not) with its results.
      const loadedSession = readOnly
        ? (openResult.docs[0] ?? lastCompletedResult.docs[0] ?? null)
        : (openResult.docs[0] ?? null)
      const previousSession = lastCompletedResult.docs[0] ?? null

      const [setsResult, notesResult, prevSetsResult] = await Promise.all([
        loadedSession
          ? sdk.find({
              collection: 'set-logs',
              where: { session: { equals: loadedSession.id } },
              limit: 500,
              depth: 0,
              sort: 'setNumber',
            })
          : Promise.resolve({ docs: [] as SetLog[] }),
        loadedSession
          ? sdk.find({
              collection: 'exercise-logs',
              where: { session: { equals: loadedSession.id } },
              limit: 500,
              depth: 0,
            })
          : Promise.resolve({ docs: [] as ExerciseLog[] }),
        previousSession && previousSession.id !== loadedSession?.id
          ? sdk.find({
              collection: 'set-logs',
              where: { session: { equals: previousSession.id } },
              limit: 500,
              depth: 0,
              sort: 'setNumber',
            })
          : Promise.resolve({ docs: [] as SetLog[] }),
      ])
      if (!active) return

      setSession(loadedSession)
      setSets(setsResult.docs)
      setExerciseNotes(notesResult.docs)
      setPrevSets(prevSetsResult.docs)
      setLoadedWorkoutId(workout.id)
    }

    load().catch((loadError) => {
      if (!active) return
      setError(loadError instanceof Error ? loadError.message : t('loadError'))
      setLoadedWorkoutId(workout.id)
    })

    return () => {
      active = false
    }
  }, [workout.id, readOnly, showResults, t])

  const runMutation = useCallback(
    async <T,>(fn: () => Promise<T>, fallback: string): Promise<T | null> => {
      setPendingSaves((count) => count + 1)
      try {
        const result = await fn()
        setError(null)
        setLastSaveFailed(false)
        setHasSavedOnce(true)
        return result
      } catch (mutationError) {
        setLastSaveFailed(true)
        setError(mutationError instanceof Error ? mutationError.message : fallback)
        return null
      } finally {
        setPendingSaves((count) => count - 1)
      }
    },
    [],
  )

  const creating = useRef<Promise<WorkoutLog> | null>(null)
  const ensureSession = async (): Promise<WorkoutLog> => {
    if (displayedSession) return displayedSession
    if (!creating.current) {
      creating.current = sdk
        .create({ collection: 'workout-logs', data: { workout: workout.id } })
        .then((doc) => {
          setSession(doc)
          setLoadedWorkoutId(workout.id)
          return doc
        })
        .catch((createError) => {
          // Reset so the next attempt can retry instead of reusing the failure.
          creating.current = null
          throw createError
        })
    }
    return creating.current
  }

  const setsForRow = useCallback(
    (rowId: number) =>
      displayedSets
        .filter((set) => relationshipId(set.exerciseRow) === rowId)
        .sort(
          (firstSet, secondSet) => (firstSet.setNumber ?? 0) - (secondSet.setNumber ?? 0),
        ),
    [displayedSets],
  )

  const prevSetsForRow = useCallback(
    (rowId: number) =>
      (hasLoaded ? prevSets : [])
        .filter((set) => relationshipId(set.exerciseRow) === rowId)
        .sort(
          (firstSet, secondSet) => (firstSet.setNumber ?? 0) - (secondSet.setNumber ?? 0),
        ),
    [hasLoaded, prevSets],
  )

  const noteForRow = (rowId: number): string =>
    displayedNotes.find((entry) => relationshipId(entry.exerciseRow) === rowId)?.note ?? ''

  const nextSetNumber = (rowId: number): number =>
    setsForRow(rowId).reduce((max, set) => Math.max(max, set.setNumber ?? 0), 0) + 1

  const setTime = (field: 'startedAt' | 'finishedAt', iso: string | null) =>
    runMutation(async () => {
      const s = await ensureSession()
      const doc = await sdk.update({ collection: 'workout-logs', id: s.id, data: { [field]: iso } })
      setSession(doc)
    }, t('timeSaveError'))

  const saveTimes = (startedAt: string | null, finishedAt: string | null) =>
    runMutation(async () => {
      const s = await ensureSession()
      const doc = await sdk.update({
        collection: 'workout-logs',
        id: s.id,
        data: { startedAt, finishedAt },
      })
      setSession(doc)
    }, t('timeSaveError'))

  /**
   * Idempotent set save keyed by (session, exerciseRow, setNumber).
   * Retries and double-taps update the same row instead of duplicating it.
   * Returns the set number the values were saved under.
   */
  const upsertSet = async (
    exercise: WorkoutExerciseTree,
    fields: MetricField[],
    values: MetricFormValues,
    setNumber?: number,
  ): Promise<number | null> => {
    const targetSetNumber = setNumber ?? nextSetNumber(exercise.id)
    const result = await runMutation(async () => {
      const s = await ensureSession()
      const { doc } = await postJson<{ doc: SetLog }>('/api/set-logs/upsert', {
        session: s.id,
        exercise: exercise.exercise?.id ?? undefined,
        exerciseName: getExerciseName(exercise),
        exerciseRow: exercise.id,
        setNumber: targetSetNumber,
        ...toSetLogMetricData(fields, values),
      })
      setSets((prev) => {
        const existing = prev.find((set) => set.id === doc.id)
        return existing ? prev.map((set) => (set.id === doc.id ? doc : set)) : [...prev, doc]
      })
      return doc
    }, t('setSaveError'))
    return result ? targetSetNumber : null
  }

  const updateSet = (id: number, fields: MetricField[], values: MetricFormValues) =>
    runMutation(async () => {
      const doc = await sdk.update({
        collection: 'set-logs',
        id,
        depth: 0,
        data: toSetLogMetricData(fields, values),
      })
      setSets((prev) =>
        prev.map((set) => (set.id === id ? doc : set)),
      )
    }, t('setUpdateError'))

  const deleteSet = (id: number) =>
    runMutation(async () => {
      await sdk.delete({ collection: 'set-logs', id })
      setSets((prev) => prev.filter((set) => set.id !== id))
    }, t('setDeleteError'))

  const finishWorkout = () =>
    runMutation(async () => {
      const s = await ensureSession()
      const { doc } = await postJson<{ doc: WorkoutLog }>(
        `/api/workout-logs/${s.id}/finish`,
        undefined,
      )
      setSession(doc)
    }, t('finishError'))

  const saveSessionNote = (note: string) =>
    runMutation(async () => {
      const s = await ensureSession()
      const doc = await sdk.update({
        collection: 'workout-logs',
        id: s.id,
        depth: 0,
        data: { notes: note.trim() },
      })
      setSession(doc)
    }, t('noteSaveError'))

  const saveExerciseNote = (exercise: WorkoutExerciseTree, note: string) =>
    runMutation(async () => {
      const s = await ensureSession()
      const rowId = exercise.id
      const exerciseName = getExerciseName(exercise)
      const existing = displayedNotes.find(
        (entry) => relationshipId(entry.exerciseRow) === rowId,
      )
      const trimmed = note.trim()

      const doc = existing
        ? await sdk.update({
            collection: 'exercise-logs',
            id: existing.id,
            depth: 0,
            data: { note: trimmed },
          })
        : await sdk.create({
            collection: 'exercise-logs',
            depth: 0,
            data: {
              session: s.id,
              exercise: exercise.exercise?.id ?? undefined,
              exerciseName,
              exerciseRow: rowId,
              note: trimmed,
            },
          })

      setExerciseNotes((prev) =>
        prev.some((entry) => entry.id === doc.id)
          ? prev.map((entry) => (entry.id === doc.id ? doc : entry))
          : [...prev, doc],
      )
    }, t('noteSaveError'))

  return {
    session: displayedSession,
    sessionCompleted,
    hasLoaded,
    error,
    saveStatus,
    clearError: () => setError(null),
    setsForRow,
    prevSetsForRow,
    noteForRow,
    setTime,
    saveTimes,
    upsertSet,
    updateSet,
    deleteSet,
    finishWorkout,
    saveExerciseNote,
    saveSessionNote,
  }
}
