import { METRIC_FIELDS, type MetricField } from '@/collections/exercises/types'
import { PROTOCOL_LABEL } from '@/types/constants'
import type { SetLog, Values } from '@/types/workout'
import { formatMinSec, formatSec } from './date'
import { BODYWEIGHT_KEY, minKey, secKey, unitKey } from './metric-keys'

type ExerciseMetaLabels = {
  seriesPrefix: string
  durationPrefix: string
  restPrefix: string
}

type UnitMeta = { options: { value: string; factor: number }[]; default: string }

const numericOrNull = (value?: string): number | null => {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') return null
  const numericValue = Number(trimmed)
  return Number.isFinite(numericValue) ? numericValue : null
}

const textOrNull = (value?: string): string | null => value?.trim() || null

/** Returns the conversion factor for a unit, defaulting to 1 when not found. */
const unitFactor = (units: UnitMeta, unit: string): number =>
  units.options.find((option) => option.value === unit)?.factor ?? 1

/** A value counts as filled when it is non-empty and not the 'x' placeholder used for "no value". */
export const isValidValue = (value?: string | null): boolean => {
  const trimmed = value?.trim() ?? ''
  return trimmed !== '' && trimmed.toLowerCase() !== 'x'
}

export const formatSideReps = (repsLeft?: string | null, repsRight?: string | null): string | null => {
  const left = isValidValue(repsLeft) ? repsLeft!.trim() : null
  const right = isValidValue(repsRight) ? repsRight!.trim() : null

  if (left && right) return `${left}+${right}`
  return left ?? right
}

export const buildExerciseMeta = (
  ex: {
    rounds?: string | null
    reps?: string | null
    repsLeft?: string | null
    repsRight?: string | null
    durationMin?: number | null
    durationSec?: number | null
    rest?: string | null
    tut?: string | null
    rir?: string | null
    kg?: string | null
  },
  labels: ExerciseMetaLabels,
): string[] => {
  const parts: string[] = []
  if (isValidValue(ex.rounds)) parts.push(`${labels.seriesPrefix}: ${ex.rounds}`)
  const sideReps = formatSideReps(ex.repsLeft, ex.repsRight)
  if (sideReps) parts.push(`Steps: ${sideReps}`)
  else if (isValidValue(ex.reps)) parts.push(`Steps: ${ex.reps}`)
  const dur = formatMinSec(ex.durationMin, ex.durationSec)
  if (dur) parts.push(`${labels.durationPrefix}: ${dur}`)
  if (isValidValue(ex.rest)) parts.push(`${labels.restPrefix}: ${ex.rest}`)
  if (isValidValue(ex.tut)) parts.push(`TUT: ${ex.tut}`)
  if (isValidValue(ex.rir)) parts.push(`RIR: ${ex.rir}`)
  if (isValidValue(ex.kg)) parts.push(`KG: ${ex.kg}`)
  return parts
}

export const metricBody = (fields: MetricField[], values: Values): Record<string, unknown> => {
  const body: Record<string, unknown> = {}
  const isBodyweight = values[BODYWEIGHT_KEY] === 'true'

  for (const field of fields) {
    const meta = METRIC_FIELDS[field]
    if (meta.composite === 'duration') {
      const mins = (values[minKey(field)] ?? '').trim()
      const secs = (values[secKey(field)] ?? '').trim()
      body[field] = mins === '' && secs === '' ? null : (Number(mins) || 0) * 60 + (Number(secs) || 0)
      continue
    }

    if (isBodyweight && meta.bodyweightAffected) {
      body[field] = null
      continue
    }

    const raw = (values[field] ?? '').trim()
    if (raw === '') {
      body[field] = null
    } else if (meta.units) {
      const unit = values[unitKey(field)] || meta.units.default
      body[field] = Number(raw) * unitFactor(meta.units, unit)
    } else {
      body[field] = meta.numeric ? numericOrNull(raw) : textOrNull(raw)
    }
  }

  body.isBodyweight = isBodyweight
  body.note = values.note?.trim() || null
  return body
}

export const toDefaultUnit = (field: MetricField, base: number): { value: string; unit: string } => {
  const meta = METRIC_FIELDS[field]
  if (!meta.units) return { value: String(base), unit: '' }
  const unit = meta.units.default
  return { value: String(base / unitFactor(meta.units, unit)), unit }
}

export const setSummary = (set: SetLog): string => {
  const parts: string[] = []
  if (set.isBodyweight) parts.push('MC')
  else {
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

export const workoutGroupLabel = (group: {
  protocol?: unknown
}): string => {
  const protocol = group.protocol as keyof typeof PROTOCOL_LABEL | undefined
  return protocol ? (PROTOCOL_LABEL[protocol] ?? protocol) : ''
}

export const workoutGroupMeta = (group: {
  protocol?: unknown
  rounds?: unknown
  intervalSeconds?: unknown
  workSeconds?: unknown
  restSeconds?: unknown
}): string[] => {
  const protocol = group.protocol as string | undefined
  const rounds = group.rounds as string | null | undefined
  const intervalSeconds = group.intervalSeconds as number | null | undefined
  const workSeconds = group.workSeconds as number | null | undefined
  const restSeconds = group.restSeconds as number | null | undefined
  if (protocol !== 'emom') return []

  const parts: string[] = []
  if (rounds) parts.push(`Duration: ${rounds} min`)
  if (intervalSeconds != null) parts.push(`Interval: ${intervalSeconds} s`)
  if (workSeconds != null) parts.push(`Work: ${workSeconds} s`)
  if (restSeconds != null) parts.push(`Rest: ${restSeconds} s`)
  return parts
}

export const setLogToFormValues = (set: SetLog, fields: MetricField[]): Values => {
  const initial: Values = { note: set.note ?? '' }
  if (set.isBodyweight) initial[BODYWEIGHT_KEY] = 'true'

  for (const field of fields) {
    const raw = (set as Record<string, unknown>)[field]
    if (raw == null) {
      initial[field] = ''
    } else if (METRIC_FIELDS[field].composite === 'duration') {
      const base = Number(raw)
      initial[minKey(field)] = String(Math.floor(base / 60))
      initial[secKey(field)] = String(base % 60)
    } else if (METRIC_FIELDS[field].units) {
      const conv = toDefaultUnit(field, Number(raw))
      initial[field] = conv.value
      initial[unitKey(field)] = conv.unit
    } else {
      initial[field] = String(raw)
    }
  }
  return initial
}
