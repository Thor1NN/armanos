'use client'

import { useEffect, useRef, useState } from 'react'
import type { MetricField } from '@/collections/exercises/types'
import { metricBody } from '@/lib/metrics'
import { sdk } from '@/lib/sdk'
import type { Session, SetLog, TExercise, TWorkout, Values } from '@/types/workout'

const toSession = (doc: unknown): Session => doc as unknown as Session
const toSetLog = (doc: unknown): SetLog => doc as unknown as SetLog

export function useWorkoutSession(
  workout: TWorkout,
  options: { readOnly?: boolean; showResults?: boolean },
) {
  const { readOnly, showResults } = options

  const [session, setSession] = useState<Session | null>(null)
  const [sets, setSets] = useState<SetLog[]>([])
  const [loadedWorkoutId, setLoadedWorkoutId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasLoaded = loadedWorkoutId === workout.id
  const displayedSession = hasLoaded ? session : null
  const displayedSets = hasLoaded ? sets : []

  useEffect(() => {
    if (readOnly && !showResults) return
    let active = true

    sdk
      .find({ collection: 'workout-logs', where: { workout: { equals: workout.id } }, limit: 1, depth: 0, sort: '-updatedAt' })
      .then(async (result) => {
        if (!active) return
        const loadedSession = (result.docs[0] ?? null) as Session | null

        if (!loadedSession) {
          setSession(null)
          setSets([])
          setLoadedWorkoutId(workout.id)
          return
        }

        setSession(loadedSession)
        const setsResult = await sdk.find({
          collection: 'set-logs',
          where: { session: { equals: loadedSession.id } },
          limit: 500,
          depth: 0,
          sort: 'setNumber',
        })
        if (!active) return

        setSets(setsResult.docs as unknown as SetLog[])
        setLoadedWorkoutId(workout.id)
      })
      .catch((loadError) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'Błąd ładowania sesji')
        setLoadedWorkoutId(workout.id)
      })

    return () => {
      active = false
    }
  }, [workout.id, readOnly, showResults])

  const runMutation = async (fn: () => Promise<void>, fallback: string) => {
    try {
      await fn()
      setError(null)
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : fallback)
    }
  }

  const creating = useRef<Promise<Session> | null>(null)
  const ensureSession = async (): Promise<Session> => {
    if (displayedSession) return displayedSession
    if (!creating.current) {
      creating.current = sdk
        .create({ collection: 'workout-logs', data: { workout: workout.id } as never })
        .then((doc) => {
          const created = toSession(doc)
          setSession(created)
          setLoadedWorkoutId(workout.id)
          return created
        })
    }
    return creating.current
  }

  const setsForRow = (rowId: string) =>
    displayedSets
      .filter((set) => String(set.exerciseRow) === rowId)
      .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0))

  const setTime = (field: 'startedAt' | 'finishedAt', iso: string | null) =>
    runMutation(async () => {
      const s = await ensureSession()
      const doc = await sdk.update({ collection: 'workout-logs', id: s.id, data: { [field]: iso } as never })
      setSession(toSession(doc))
    }, 'Błąd zapisu czasu')

  const saveTimes = (startedAt: string | null, finishedAt: string | null) =>
    runMutation(async () => {
      const s = await ensureSession()
      const doc = await sdk.update({ collection: 'workout-logs', id: s.id, data: { startedAt, finishedAt } as never })
      setSession(toSession(doc))
    }, 'Błąd zapisu czasu')

  const addSet = (ex: TExercise, fields: MetricField[], values: Values) =>
    runMutation(async () => {
      const s = await ensureSession()
      const setNumber = setsForRow(ex.rowId).length + 1
      const doc = await sdk.create({
        collection: 'set-logs',
        depth: 0,
        data: {
          session: s.id,
          exercise: ex.exerciseId ?? undefined,
          exerciseName: ex.exerciseName,
          exerciseRow: Number(ex.rowId),
          setNumber,
          ...metricBody(fields, values),
        } as never,
      })
      setSets((prev) => [...prev, toSetLog(doc)])
    }, 'Błąd zapisu serii')

  const updateSet = (id: number, fields: MetricField[], values: Values) =>
    runMutation(async () => {
      const doc = await sdk.update({ collection: 'set-logs', id, depth: 0, data: metricBody(fields, values) as never })
      setSets((prev) => prev.map((set) => (set.id === id ? { ...set, ...toSetLog(doc) } : set)))
    }, 'Błąd aktualizacji serii')

  const deleteSet = (id: number) =>
    runMutation(async () => {
      await sdk.delete({ collection: 'set-logs', id })
      setSets((prev) => prev.filter((set) => set.id !== id))
    }, 'Błąd usunięcia serii')

  return {
    session: displayedSession,
    hasLoaded,
    error,
    clearError: () => setError(null),
    setsForRow,
    setTime,
    saveTimes,
    addSet,
    updateSet,
    deleteSet,
  }
}
