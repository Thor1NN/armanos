import type { ExerciseTargetType, MetricField, MetricMeta, TrackingType } from './types'

export const EXERCISE_TARGET_TYPE_OPTIONS = [
  { label: 'Repetitions', value: 'repetitions' },
  { label: 'Duration', value: 'duration' },
] satisfies Array<{ label: string; value: ExerciseTargetType }>

export const METRIC_FIELDS: Record<MetricField, MetricMeta> = {
  weightLeft: {
    label: 'Weight left (kg)',
    placeholder: 'KG left',
    numeric: true,
    bodyweightAffected: true,
  },
  weightRight: {
    label: 'Weight right (kg)',
    placeholder: 'KG right',
    numeric: true,
    bodyweightAffected: true,
  },
  repsLeft: { label: 'Reps left', placeholder: 'reps', numeric: false },
  repsRight: { label: 'Reps right', placeholder: 'reps', numeric: false },
  distanceM: { label: 'Distance (m)', placeholder: 'distance', numeric: true },
  durationSec: {
    label: 'Duration',
    placeholder: 'minutes / seconds',
    numeric: true,
    composite: 'duration',
  },
}

export const ALL_METRIC_FIELDS = Object.keys(METRIC_FIELDS) as MetricField[]

export const TRACKING: Record<TrackingType, { label: string; fields: MetricField[] }> = {
  strength: {
    label: 'Strength',
    fields: ['weightLeft', 'weightRight', 'repsLeft', 'repsRight'],
  },
  cardio: {
    label: 'Cardio',
    fields: ['distanceM', 'durationSec'],
  },
}

export const DEFAULT_TRACKING: TrackingType = 'strength'

export const TRACKING_OPTIONS = (Object.keys(TRACKING) as TrackingType[]).map((value) => ({
  label: TRACKING[value].label,
  value,
}))
