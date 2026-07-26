import { formatSideReps } from '@/modules/training/exercises'
import { formatSec } from '@/lib/date'
import type { SetLog } from '@/payload-types'

export const formatSetLogSummary = (set: SetLog): string => {
  const parts: string[] = []

  if (set.isBodyweight) {
    parts.push('MC')
  } else {
    if (set.weightLeft != null) parts.push(`L ${set.weightLeft} kg`)
    if (set.weightRight != null) parts.push(`R ${set.weightRight} kg`)
  }

  if (set.distanceM != null) parts.push(`${set.distanceM} m`)
  if (set.durationSec != null) parts.push(formatSec(set.durationSec))

  const sideReps = formatSideReps(set.repsLeft, set.repsRight)
  if (sideReps) parts.push(`Steps: ${sideReps}`)
  if (set.note) parts.push(set.note)

  return parts.length ? parts.join(' · ') : '—'
}
