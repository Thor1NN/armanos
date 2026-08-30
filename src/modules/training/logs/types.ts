import type { MetricField } from '@/modules/training/exercises'
import type { SetLog } from '@/payload-types'

type BodyweightFormField = typeof import('./constants').BODYWEIGHT_FORM_FIELD

export type MetricFormField =
  | MetricField
  | `${MetricField}__min`
  | `${MetricField}__sec`
  | `${MetricField}__unit`
  | BodyweightFormField
  | 'note'
  | 'setType'

export type MetricFormValues = Partial<Record<MetricFormField, string>>

export type SetLogMetricInput = Partial<Pick<SetLog, MetricField>> & {
  isBodyweight: NonNullable<SetLog['isBodyweight']>
  note: SetLog['note']
  setType: NonNullable<SetLog['setType']>
}
