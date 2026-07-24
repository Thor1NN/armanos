/**
 * Single source of truth: exercise tracking type → which metrics we collect.
 * Used by: the logging form (which inputs to show) and the SetLog hook (clearing fields outside the type).
 */

export type MetricField = 'weightLeft' | 'weightRight' | 'repsLeft' | 'repsRight' | 'distanceM' | 'durationSec'
export type TrackingType = 'strength' | 'cardio'

export type UnitOption = { label: string; value: string; factor: number }
export type MetricMeta = {
  label: string
  placeholder: string
  numeric: boolean
  // Composite field: input in min + sec, stored in DB as total seconds
  composite?: 'duration'
  // Front-end input units; stored in DB as base value (factor = how many base units per 1 selected unit)
  units?: { default: string; options: UnitOption[] }
  bodyweightAffected?: boolean
}

export const METRIC_FIELDS: Record<MetricField, MetricMeta> = {
  weightLeft: { label: 'Weight left (kg)', placeholder: 'KG left', numeric: true, bodyweightAffected: true },
  weightRight: { label: 'Weight right (kg)', placeholder: 'KG right', numeric: true, bodyweightAffected: true },
  repsLeft: { label: 'Reps left', placeholder: 'reps', numeric: false },
  repsRight: { label: 'Reps right', placeholder: 'reps', numeric: false },
  distanceM: { label: 'Distance (m)', placeholder: 'distance', numeric: true },
  durationSec: { label: 'Duration', placeholder: 'minutes / seconds', numeric: true, composite: 'duration' },
}

export const ALL_METRIC_FIELDS = Object.keys(METRIC_FIELDS) as MetricField[]

export const LEGACY_SET_LOG_FIELDS = ['weight', 'reps', 'rir'] as const

export const TRACKING: Record<TrackingType, { label: string; fields: MetricField[] }> = {
  strength: { label: 'Strength', fields: ['weightLeft', 'weightRight', 'repsLeft', 'repsRight'] },
  cardio: { label: 'Cardio', fields: ['distanceM', 'durationSec'] },
}

export const DEFAULT_TRACKING: TrackingType = 'strength'

/** List of fields for the given type (with fallback to the default). */
export const trackingFields = (t?: string | null): MetricField[] =>
  t && t in TRACKING ? TRACKING[t as TrackingType].fields : TRACKING[DEFAULT_TRACKING].fields

/** Select options for Payload. */
export const trackingOptions = (Object.keys(TRACKING) as TrackingType[]).map((value) => ({
  label: TRACKING[value].label,
  value,
}))
