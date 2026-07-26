import type { WorkoutGroup } from '@/payload-types'
import type { ExerciseRow } from '../types'
import { formatMinSec } from '@/lib/date'
import { formatSideReps } from '@/modules/training/exercises'

export const groupLabel = (g: WorkoutGroup): string => {
  const p = g.protocol ?? 'standard'
  const r = g.rounds
  const d = g.durationMinutes
  if (p === 'emom') return r ? `EMOM · ${r} min` : 'EMOM'
  if (p === 'amrap') return d ? `AMRAP · ${d} min` : 'AMRAP'
  if (p === 'for_time') return r ? `For Time · ${r} rounds` : 'For Time'
  if (p === 'tabata') return 'Tabata'
  return r ? `${r} sets` : 'Standard'
}

export const exerciseLabel = (row: ExerciseRow): string => row.exercise?.name ?? row.note ?? '—'

export const exerciseMeta = (row: ExerciseRow): string => {
  const parts: string[] = []
  if (row.rounds) parts.push(`${row.rounds} sets`)
  if (row.targetType === 'duration') {
    const duration = formatMinSec(row.durationMin, row.durationSec)
    if (duration) parts.push(`Duration: ${duration}`)
  } else {
    const sideReps = formatSideReps(row.repsLeft, row.repsRight)
    if (sideReps) parts.push(`Steps: ${sideReps}`)
    else if (row.reps) parts.push(`Steps: ${row.reps}`)
  }
  if (row.kg) parts.push(`KG: ${row.kg}`)
  if (row.rir) parts.push(`RIR ${row.rir}`)
  if (row.tut) parts.push(`TUT ${row.tut}`)
  if (row.rest) parts.push(`Rest(s): ${row.rest}`)
  return parts.join(' · ')
}
