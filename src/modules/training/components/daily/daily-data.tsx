'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { sdk } from '@/lib/sdk'
import { isWorkingSet } from '@/modules/training/logs'
import type { BodyMeasurement, DiaryEntry, SetLog, WorkoutLog } from '@/payload-types'

/** Local calendar day key (YYYY-MM-DD). Grouping is always local-time. */
export const dayKey = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Noon-anchored copy for display formatting (next-intl formats in UTC). */
export const atNoon = (date: Date): Date => {
  const copy = new Date(date)
  copy.setHours(12, 0, 0, 0)
  return copy
}

export type DailySnapshot = {
  entries: DiaryEntry[]
  measurements: BodyMeasurement[]
  /** Sessions completed on the selected day. */
  completedSessions: WorkoutLog[]
  /** Working sets across the day's completed sessions. */
  completedSets: number
  /** An unfinished session started on the selected day, if any. */
  openSession: WorkoutLog | null
  openSessionSets: number
}

type DailyDataValue = {
  date: Date
  key: string
  isToday: boolean
  setDate: (date: Date) => void
  shiftDay: (direction: 1 | -1) => void
  data: DailySnapshot | null
  loading: boolean
  error: string | null
  /** Bumps after every successful mutation; cards subscribe to refetch. */
  version: number
  refresh: () => void
}

const DailyDataContext = createContext<DailyDataValue | null>(null)

const relId = (value: number | { id: number } | null | undefined): number | null =>
  value && typeof value === 'object' ? value.id : (value ?? null)

/**
 * Single source of truth for "the selected day": diary entries, body
 * measurements and workout sessions. Every mutation on the home screen
 * calls `refresh()` so rings, timeline and reports never disagree.
 */
export function DailyDataProvider({ children }: { children: React.ReactNode }) {
  const [date, setDateState] = useState(() => startOfDay(new Date()))
  const [data, setData] = useState<DailySnapshot | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const key = dayKey(date)
  const isToday = key === dayKey(new Date())

  const setDate = useCallback((next: Date) => setDateState(startOfDay(next)), [])
  const shiftDay = useCallback(
    (direction: 1 | -1) => setDateState((current) => startOfDay(addDays(current, direction))),
    [],
  )
  const refresh = useCallback(() => setVersion((current) => current + 1), [])

  useEffect(() => {
    let active = true
    const start = date.toISOString()
    const end = addDays(date, 1).toISOString()

    const load = async () => {
      const [entries, measurements, completed, open] = await Promise.all([
        sdk.find({
          collection: 'diary-entries',
          where: {
            and: [{ entryDate: { greater_than_equal: start } }, { entryDate: { less_than: end } }],
          },
          sort: 'createdAt',
          limit: 200,
          depth: 0,
        }),
        sdk.find({
          collection: 'body-measurements',
          where: {
            and: [{ measuredAt: { greater_than_equal: start } }, { measuredAt: { less_than: end } }],
          },
          sort: 'measuredAt',
          limit: 50,
          depth: 0,
        }),
        sdk.find({
          collection: 'workout-logs',
          where: {
            and: [{ completedAt: { greater_than_equal: start } }, { completedAt: { less_than: end } }],
          },
          sort: 'completedAt',
          limit: 20,
          depth: 0,
        }),
        sdk.find({
          collection: 'workout-logs',
          where: {
            and: [
              { completedAt: { exists: false } },
              { startedAt: { greater_than_equal: start } },
              { startedAt: { less_than: end } },
            ],
          },
          sort: '-updatedAt',
          limit: 1,
          depth: 0,
        }),
      ])

      const openSession = open.docs[0] ?? null
      const sessionIds = [...completed.docs.map((doc) => doc.id), ...(openSession ? [openSession.id] : [])]
      const sets = sessionIds.length
        ? await sdk.find({
            collection: 'set-logs',
            where: { session: { in: sessionIds } },
            limit: 1000,
            depth: 0,
          })
        : { docs: [] as SetLog[] }

      if (!active) return
      const completedIds = new Set(completed.docs.map((doc) => doc.id))
      const working = sets.docs.filter(isWorkingSet)
      setData({
        entries: entries.docs,
        measurements: measurements.docs,
        completedSessions: completed.docs,
        completedSets: working.filter((set) => completedIds.has(relId(set.session) ?? -1)).length,
        openSession,
        openSessionSets: openSession
          ? working.filter((set) => relId(set.session) === openSession.id).length
          : 0,
      })
      setError(null)
      setLoadedKey(key)
    }

    load().catch((loadError) => {
      if (!active) return
      setError(loadError instanceof Error ? loadError.message : 'Failed to load the day')
      setLoadedKey(key)
    })
    return () => {
      active = false
    }
  }, [date, key, version])

  const value = useMemo<DailyDataValue>(
    () => ({
      date,
      key,
      isToday,
      setDate,
      shiftDay,
      data: loadedKey === key ? data : null,
      loading: loadedKey !== key,
      error,
      version,
      refresh,
    }),
    [date, key, isToday, setDate, shiftDay, data, loadedKey, error, version, refresh],
  )

  return <DailyDataContext.Provider value={value}>{children}</DailyDataContext.Provider>
}

export function useDailyData(): DailyDataValue {
  const value = useContext(DailyDataContext)
  if (!value) throw new Error('useDailyData must be used inside DailyDataProvider')
  return value
}
