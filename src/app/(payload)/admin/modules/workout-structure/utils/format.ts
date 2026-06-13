import type { ExerciseRow, Group } from '../types'

export const groupLabel = (g: Group): string => {
  const p = g.protocol ?? 'standard'
  const r = g.rounds
  const d = g.durationMinutes
  if (p === 'emom') return r ? `EMOM · ${r} min` : 'EMOM'
  if (p === 'amrap') return d ? `AMRAP · ${d} min` : 'AMRAP'
  if (p === 'for_time') return r ? `For Time · ${r} rund` : 'For Time'
  if (p === 'tabata') return 'Tabata'
  return r ? `${r} serie` : 'Standard'
}

export const exerciseLabel = (row: ExerciseRow): string =>
  row.exercise?.name ?? row.note ?? '—'

export const exerciseMeta = (row: ExerciseRow): string => {
  const parts: string[] = []
  if (row.rounds) parts.push(`${row.rounds} serie`)
  if (row.reps) parts.push(`${row.reps} powt.`)
  if (row.kg) parts.push(`${row.kg} kg`)
  if (row.rir) parts.push(`RIR ${row.rir}`)
  if (row.tut) parts.push(`TUT ${row.tut}`)
  if (row.rest) parts.push(`przerwa ${row.rest}`)
  return parts.join(' · ')
}
