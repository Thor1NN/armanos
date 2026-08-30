import type { SetLog } from '@/payload-types'

/**
 * Pure strength-metric math shared by charts, records, and the workout
 * summary. Warm-up sets never count toward records or volume.
 */

export type SetMetrics = {
  weight: number
  reps: number
  volume: number
  e1rm: number
}

const parseReps = (value: string | null | undefined): number => {
  if (!value) return 0
  const num = Number(value.trim())
  return Number.isFinite(num) && num > 0 ? num : 0
}

export const isWorkingSet = (set: Pick<SetLog, 'setType'>): boolean => set.setType !== 'warmup'

/** Heaviest side wins for unilateral logging; volume counts both sides. */
export const setMetrics = (
  set: Pick<SetLog, 'weightLeft' | 'weightRight' | 'repsLeft' | 'repsRight'>,
): SetMetrics => {
  const weight = Math.max(set.weightLeft ?? 0, set.weightRight ?? 0)
  const repsLeft = parseReps(set.repsLeft)
  const repsRight = parseReps(set.repsRight)
  const reps = Math.max(repsLeft, repsRight)
  const volume = (set.weightLeft ?? 0) * repsLeft + (set.weightRight ?? 0) * repsRight
  return {
    weight,
    reps,
    volume,
    e1rm: estimateOneRepMax(weight, reps),
  }
}

/** Epley estimated 1RM; equals the weight itself for a single rep or unknown reps. */
export const estimateOneRepMax = (weight: number, reps: number): number => {
  if (weight <= 0) return 0
  if (reps <= 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

export type ExerciseRecords = {
  bestWeight: number
  bestE1rm: number
  bestSetVolume: number
}

/** Best working-set records across a set list. */
export const exerciseRecords = (sets: SetLog[]): ExerciseRecords =>
  sets.filter(isWorkingSet).reduce<ExerciseRecords>(
    (records, set) => {
      const metrics = setMetrics(set)
      return {
        bestWeight: Math.max(records.bestWeight, metrics.weight),
        bestE1rm: Math.max(records.bestE1rm, metrics.e1rm),
        bestSetVolume: Math.max(records.bestSetVolume, metrics.volume),
      }
    },
    { bestWeight: 0, bestE1rm: 0, bestSetVolume: 0 },
  )

export type PrKind = 'weight' | 'e1rm' | 'volume'

/** Which records does `sessionSets` break relative to `historySets`? */
export const detectPrs = (
  sessionSets: SetLog[],
  historySets: SetLog[],
): { kind: PrKind; value: number; previous: number }[] => {
  const now = exerciseRecords(sessionSets)
  const before = exerciseRecords(historySets)
  const prs: { kind: PrKind; value: number; previous: number }[] = []
  if (now.bestWeight > before.bestWeight && now.bestWeight > 0) {
    prs.push({ kind: 'weight', value: now.bestWeight, previous: before.bestWeight })
  }
  if (now.bestE1rm > before.bestE1rm && now.bestE1rm > 0) {
    prs.push({ kind: 'e1rm', value: now.bestE1rm, previous: before.bestE1rm })
  }
  if (now.bestSetVolume > before.bestSetVolume && now.bestSetVolume > 0) {
    prs.push({ kind: 'volume', value: now.bestSetVolume, previous: before.bestSetVolume })
  }
  return prs
}

/** Total working volume (kg) across a session's sets. */
export const sessionVolume = (sets: SetLog[]): number =>
  Math.round(sets.filter(isWorkingSet).reduce((sum, set) => sum + setMetrics(set).volume, 0))
