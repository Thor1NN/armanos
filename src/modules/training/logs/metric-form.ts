import {
  METRIC_FIELDS,
  type MetricField,
  type MetricUnits,
} from '@/modules/training/exercises'
import { BODYWEIGHT_FORM_FIELD } from './constants'
import type { MetricFormValues, SetLog, SetLogMetricData } from './types'

export const getMetricMinutesField = <Field extends MetricField>(field: Field): `${Field}__min` =>
  `${field}__min`

export const getMetricSecondsField = <Field extends MetricField>(field: Field): `${Field}__sec` =>
  `${field}__sec`

export const getMetricUnitField = <Field extends MetricField>(field: Field): `${Field}__unit` =>
  `${field}__unit`

const parseFiniteNumber = (value?: string): number | null => {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') return null

  const numericValue = Number(trimmed)
  return Number.isFinite(numericValue) ? numericValue : null
}

const textOrNull = (value?: string): string | null => value?.trim() || null

const getUnitFactor = (units: MetricUnits, unit: string): number =>
  units.options.find((option) => option.value === unit)?.factor ?? 1

const toDurationSeconds = (minutesValue?: string, secondsValue?: string): number | null => {
  const minutesText = minutesValue?.trim() ?? ''
  const secondsText = secondsValue?.trim() ?? ''

  if (minutesText === '' && secondsText === '') return null

  const minutes = minutesText === '' ? 0 : parseFiniteNumber(minutesText)
  const seconds = secondsText === '' ? 0 : parseFiniteNumber(secondsText)

  if (minutes === null || seconds === null) return null
  return minutes * 60 + seconds
}

const fromBaseUnit = (field: MetricField, baseValue: number): { value: string; unit: string } => {
  const units = METRIC_FIELDS[field].units
  if (!units) return { value: String(baseValue), unit: '' }

  const unit = units.default
  return {
    value: String(baseValue / getUnitFactor(units, unit)),
    unit,
  }
}

export const toSetLogMetricData = (
  fields: MetricField[],
  values: MetricFormValues,
): SetLogMetricData => {
  const metricValues: Partial<Record<MetricField, number | string | null>> = {}
  const isBodyweight = values[BODYWEIGHT_FORM_FIELD] === 'true'

  for (const field of fields) {
    const meta = METRIC_FIELDS[field]

    if (meta.composite === 'duration') {
      metricValues[field] = toDurationSeconds(
        values[getMetricMinutesField(field)],
        values[getMetricSecondsField(field)],
      )
      continue
    }

    if (isBodyweight && meta.bodyweightAffected) {
      metricValues[field] = null
      continue
    }

    const rawValue = values[field]
    if (rawValue?.trim() === '') {
      metricValues[field] = null
    } else if (meta.units) {
      const numericValue = parseFiniteNumber(rawValue)
      const unit = values[getMetricUnitField(field)] || meta.units.default
      metricValues[field] =
        numericValue === null ? null : numericValue * getUnitFactor(meta.units, unit)
    } else {
      metricValues[field] = meta.numeric ? parseFiniteNumber(rawValue) : textOrNull(rawValue)
    }
  }

  return {
    ...metricValues,
    isBodyweight,
    note: values.note?.trim() || null,
  }
}

export const toMetricFormValues = (set: SetLog, fields: MetricField[]): MetricFormValues => {
  const initial: MetricFormValues = { note: set.note ?? '' }
  if (set.isBodyweight) initial[BODYWEIGHT_FORM_FIELD] = 'true'

  for (const field of fields) {
    const rawValue = set[field]

    if (rawValue == null) {
      initial[field] = ''
    } else if (METRIC_FIELDS[field].composite === 'duration') {
      const baseValue = Number(rawValue)
      initial[getMetricMinutesField(field)] = String(Math.floor(baseValue / 60))
      initial[getMetricSecondsField(field)] = String(baseValue % 60)
    } else if (METRIC_FIELDS[field].units) {
      const converted = fromBaseUnit(field, Number(rawValue))
      initial[field] = converted.value
      initial[getMetricUnitField(field)] = converted.unit
    } else {
      initial[field] = String(rawValue)
    }
  }

  return initial
}
