import 'server-only'

import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@/payload.config'
import type { SetLog, WorkoutLog } from '@/payload-types'
import { isWorkingSet, setMetrics } from '../metrics'

export type HistoryViewer =
  | { kind: 'client'; clientId: number }
  | { kind: 'coach'; clientId: number | null }

export type HistorySession = {
  session: WorkoutLog
  sets: SetLog[]
}

export type ExerciseProgressPoint = {
  sessionId: number
  date: string
  topWeight: number | null
  totalReps: number | null
  bestE1rm: number | null
  volume: number | null
}

export type ExerciseProgressSeries = {
  exerciseName: string
  points: ExerciseProgressPoint[]
}

const relId = (value: number | { id: number } | null | undefined): number | null =>
  value && typeof value === 'object' ? value.id : (value ?? null)

/**
 * Resolves who the history belongs to. Clients always see themselves — the
 * id comes from the auth session, never from the URL. A coach (`users`) may
 * pass ?client=<id> to inspect any client.
 */
export async function resolveHistoryViewer(
  clientParam?: string,
): Promise<HistoryViewer | null> {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })

  if (!user) return null
  if (user.collection === 'clients') return { kind: 'client', clientId: user.id }
  const parsed = Number(clientParam)
  return { kind: 'coach', clientId: Number.isInteger(parsed) ? parsed : null }
}

/** Completed sessions (newest first) with their logged sets. */
export async function loadWorkoutHistory(clientId: number): Promise<HistorySession[]> {
  const payload = await getPayload({ config: await config })

  const sessions = await payload.find({
    collection: 'workout-logs',
    where: {
      and: [{ client: { equals: clientId } }, { completedAt: { exists: true } }],
    },
    sort: '-completedAt',
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })
  if (!sessions.docs.length) return []

  const sets = await payload.find({
    collection: 'set-logs',
    where: { session: { in: sessions.docs.map((doc) => doc.id) } },
    sort: 'setNumber',
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
  })

  const bySession = new Map<number, SetLog[]>()
  for (const set of sets.docs) {
    const sessionId = relId(set.session)
    if (!sessionId) continue
    const list = bySession.get(sessionId) ?? []
    list.push(set)
    bySession.set(sessionId, list)
  }

  return sessions.docs.map((session) => ({
    session,
    sets: bySession.get(session.id) ?? [],
  }))
}

const parseReps = (value: string | null | undefined): number | null => {
  if (!value) return null
  const num = Number(value.trim())
  return Number.isFinite(num) ? num : null
}

/**
 * Per-exercise progress across completed sessions: top set weight and total
 * reps per session, keyed by the exercise-name snapshot (works even for rows
 * without a catalog link).
 */
export async function loadExerciseProgress(clientId: number): Promise<ExerciseProgressSeries[]> {
  const payload = await getPayload({ config: await config })

  const sessions = await payload.find({
    collection: 'workout-logs',
    where: {
      and: [{ client: { equals: clientId } }, { completedAt: { exists: true } }],
    },
    sort: 'completedAt',
    depth: 0,
    limit: 200,
    overrideAccess: true,
  })
  if (!sessions.docs.length) return []

  const sessionDate = new Map<number, string>(
    sessions.docs.map((doc) => [doc.id, (doc.completedAt ?? doc.createdAt) as string]),
  )

  const sets = await payload.find({
    collection: 'set-logs',
    where: { session: { in: sessions.docs.map((doc) => doc.id) } },
    depth: 0,
    limit: 10000,
    pagination: false,
    overrideAccess: true,
  })

  // exerciseName → sessionId → aggregate (warm-up sets excluded)
  const series = new Map<
    string,
    Map<number, { topWeight: number | null; totalReps: number; bestE1rm: number; volume: number }>
  >()
  for (const set of sets.docs) {
    const name = set.exerciseName?.trim()
    const sessionId = relId(set.session)
    if (!name || !sessionId || !sessionDate.has(sessionId)) continue
    if (!isWorkingSet(set)) continue

    const perSession = series.get(name) ?? new Map()
    const agg =
      perSession.get(sessionId) ??
      { topWeight: null as number | null, totalReps: 0, bestE1rm: 0, volume: 0 }

    const metrics = setMetrics(set)
    if (metrics.weight > 0) agg.topWeight = Math.max(agg.topWeight ?? 0, metrics.weight)
    agg.totalReps += (parseReps(set.repsLeft) ?? 0) + (parseReps(set.repsRight) ?? 0)
    agg.bestE1rm = Math.max(agg.bestE1rm, metrics.e1rm)
    agg.volume += metrics.volume

    perSession.set(sessionId, agg)
    series.set(name, perSession)
  }

  return [...series.entries()]
    .map(([exerciseName, perSession]) => ({
      exerciseName,
      points: [...perSession.entries()]
        .map(([sessionId, agg]) => ({
          sessionId,
          date: sessionDate.get(sessionId)!,
          topWeight: agg.topWeight,
          totalReps: agg.totalReps || null,
          bestE1rm: agg.bestE1rm > 0 ? agg.bestE1rm : null,
          volume: agg.volume > 0 ? Math.round(agg.volume) : null,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((entry) => entry.points.length > 0)
    .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
}
