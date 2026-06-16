import { METRIC_FIELDS, type MetricField } from '@/collections/exercises/types'
import { PROTOCOL_LABEL } from '@/types/constants'
import type { SetLog, Values } from '@/types/workout'
import { formatMinSec, formatSec } from './date'
import { BODYWEIGHT_KEY, minKey, secKey, unitKey } from './metric-keys'

type ExerciseMetaLabels = {
  seriesPrefix: string
  repsPrefix: string
  durationPrefix: string
  restPrefix: string
}

type UnitMeta = { options: { value: string; factor: number }[]; default: string }

/** Returns the conversion factor for a unit, defaulting to 1 when not found. */
const unitFactor = (units: UnitMeta, unit: string): number =>
  units.options.find((option) => option.value === unit)?.factor ?? 1

/** A value counts as filled when it is non-empty and not the 'x' placeholder used for "no value". */
export const isValidValue = (value?: string | null): boolean => {
  const trimmed = value?.trim() ?? ''
  return trimmed !== '' && trimmed.toLowerCase() !== 'x'
}

export const buildExerciseMeta = (
  ex: {
    rounds?: string | null
    reps?: string | null
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
  if (isValidValue(ex.reps)) parts.push(`${labels.repsPrefix}: ${ex.reps}`)
  const dur = formatMinSec(ex.durationMin, ex.durationSec)
  if (dur) parts.push(`${labels.durationPrefix}: ${dur}`)
  if (isValidValue(ex.rest)) parts.push(`${labels.restPrefix}: ${ex.rest}`)
  if (isValidValue(ex.tut)) parts.push(`TUT: ${ex.tut}`)
  if (isValidValue(ex.rir)) parts.push(`RIR: ${ex.rir}`)
  if (isValidValue(ex.kg)) parts.push(`${ex.kg} kg`)
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

    if (field === 'weight' && isBodyweight) {
      body.weight = null
      continue
    }

    const raw = (values[field] ?? '').trim()
    if (raw === '') {
      body[field] = null
    } else if (meta.units) {
      const unit = values[unitKey(field)] || meta.units.default
      body[field] = Number(raw) * unitFactor(meta.units, unit)
    } else {
      body[field] = meta.numeric ? Number(raw) : raw
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
  else if (set.weight != null) parts.push(`${set.weight} kg`)
  if (set.distanceM != null) parts.push(`${set.distanceM} m`)
  if (set.durationSec != null) parts.push(formatSec(set.durationSec))
  // reps is free text - empty string means "not filled", so only render a truthy value
  if (set.reps) parts.push(`× ${set.reps}`)
  if (set.rir) parts.push(`RIR ${set.rir}`)
  if (set.note) parts.push(set.note)
  return parts.length ? parts.join(' · ') : '—'
}

export const workoutGroupLabel = (group: {
  label?: unknown
  protocol?: unknown
  rounds?: unknown
  durationMinutes?: unknown
}): string => {
  if (group.label) return group.label as string
  const protocol = group.protocol as string
  const rounds = group.rounds as string | null | undefined
  const durationMinutes = group.durationMinutes as number | null | undefined
  if (protocol === 'emom') return rounds ? `${PROTOCOL_LABEL.emom} · ${rounds} min` : PROTOCOL_LABEL.emom
  if (protocol === 'amrap')
    return durationMinutes ? `${PROTOCOL_LABEL.amrap} · ${durationMinutes} min` : PROTOCOL_LABEL.amrap
  if (protocol === 'for_time') return rounds ? `${PROTOCOL_LABEL.for_time} · ${rounds} rund` : PROTOCOL_LABEL.for_time
  if (protocol === 'tabata') return PROTOCOL_LABEL.tabata
  return rounds ? `${rounds} serie` : ''
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
