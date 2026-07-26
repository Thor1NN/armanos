import type { Exercise, WorkoutExerciseRow } from '@/payload-types'

export type MetricField =
  | 'weightLeft'
  | 'weightRight'
  | 'repsLeft'
  | 'repsRight'
  | 'distanceM'
  | 'durationSec'

export type TrackingType = NonNullable<Exercise['trackingType']>

export type ExerciseTargetType = NonNullable<WorkoutExerciseRow['targetType']>

type UnitOption = {
  label: string
  value: string
  factor: number
}

export type MetricMeta = {
  label: string
  placeholder: string
  numeric: boolean
  /** Input is split into minutes and seconds, then stored as total seconds. */
  composite?: 'duration'
  /** Input units converted to a base value before persistence. */
  units?: {
    default: string
    options: UnitOption[]
  }
  bodyweightAffected?: boolean
}

export type MetricUnits = NonNullable<MetricMeta['units']>
