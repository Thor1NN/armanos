import type { MetricField } from '@/modules/training/exercises'

type BodyweightFormField = typeof import('./constants').BODYWEIGHT_FORM_FIELD

export type Session = {
  id: number
  startedAt?: string | null
  finishedAt?: string | null
  notes?: string | null
}

export type SetLog = {
  id: number
  exerciseRow?: number | null
  setNumber?: number | null
  weight?: number | null
  weightLeft?: number | null
  weightRight?: number | null
  isBodyweight?: boolean | null
  distanceM?: number | null
  durationSec?: number | null
  reps?: string | null
  repsLeft?: string | null
  repsRight?: string | null
  rir?: string | null
  note?: string | null
}

export type MetricFormField =
  | MetricField
  | `${MetricField}__min`
  | `${MetricField}__sec`
  | `${MetricField}__unit`
  | BodyweightFormField
  | 'note'

export type MetricFormValues = Partial<Record<MetricFormField, string>>

export type SetLogMetricData = Partial<Record<MetricField, number | string | null>> & {
  isBodyweight: boolean
  note: string | null
}
