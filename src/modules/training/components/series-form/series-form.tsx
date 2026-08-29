'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { METRIC_FIELDS, type MetricField } from '@/modules/training/exercises'
import {
  BODYWEIGHT_FORM_FIELD,
  getMetricMinutesField,
  getMetricSecondsField,
  type MetricFormValues,
} from '@/modules/training/logs'
import { MetricFieldInput } from './components/metric-field-input'

const AUTOSAVE_DEBOUNCE_MS = 900

export function SeriesForm({
  fields,
  initial,
  onSubmit,
  onAutosave,
  onCancel,
}: {
  fields: MetricField[]
  initial: MetricFormValues
  onSubmit: (values: MetricFormValues) => Promise<void>
  /**
   * Debounced autosave while typing (same payload as onSubmit, but the form
   * stays open). The save target is idempotent, so repeated calls are safe.
   */
  onAutosave?: (values: MetricFormValues) => Promise<void>
  onCancel?: () => void
}) {
  const t = useTranslations('seriesForm')
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<MetricFormValues>({ defaultValues: initial })

  const isBodyweight = useWatch({ control, name: BODYWEIGHT_FORM_FIELD }) === 'true'
  const visibleFields = fields.filter((field) => !isBodyweight || !METRIC_FIELDS[field].bodyweightAffected)
  const hasBodyweightFields = fields.some((field) => METRIC_FIELDS[field].bodyweightAffected)
  const toggleBodyweight = useCallback(() => {
    setValue(BODYWEIGHT_FORM_FIELD, isBodyweight ? 'false' : 'true')
    if (!isBodyweight) {
      setValue('weightLeft', '')
      setValue('weightRight', '')
    }
  }, [isBodyweight, setValue])

  const validateAtLeastOne = () => {
    const values = getValues()
    const filled = fields.some((field) => {
      const meta = METRIC_FIELDS[field]
      if (meta.composite === 'duration') {
        return (values[getMetricMinutesField(field)] ?? '').trim() !== '' || (values[getMetricSecondsField(field)] ?? '').trim() !== ''
      }
      return (values[field] ?? '').trim() !== ''
    })
    return filled || t('atLeastOneValue')
  }

  // Debounced autosave: any change persists after a short pause, without
  // closing the form. Skips until at least one metric has a value.
  const watchedValues = useWatch({ control })
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstWatch = useRef(true)
  useEffect(() => {
    if (!onAutosave) return
    if (isFirstWatch.current) {
      isFirstWatch.current = false
      return
    }
    if (validateAtLeastOne() !== true) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      void onAutosave(getValues())
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)])

  const submit = handleSubmit(async (data) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    await onSubmit(data)
  })

  const firstField = visibleFields[0]

  return (
    <form className="mt-1.5 flex flex-col gap-2" onSubmit={submit} noValidate>
      <div className="flex flex-wrap gap-2">
        {visibleFields.map((field, index) => (
          <MetricFieldInput
            key={field}
            field={field}
            isFirst={field === firstField}
            autoFocus={index === 0}
            register={register}
            control={control}
            validate={validateAtLeastOne}
          />
        ))}
        {hasBodyweightFields && (
          <Button size="sm" variant="secondary" type="button" onClick={toggleBodyweight}>
            {isBodyweight ? t('bodyweightActive') : 'MC'}
          </Button>
        )}
      </div>

      <Field label={t('note')}>
        <Input className="w-full" type="text" placeholder={t('notePlaceholder')} {...register('note')} />
      </Field>

      <div className="flex items-center gap-1.5">
        <Button size="sm" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '…' : t('save')}
        </Button>
        {onCancel && (
          <Button size="sm" variant="secondary" type="button" onClick={onCancel} aria-label={t('cancel')}>
            <X size={13} strokeWidth={2.5} />
          </Button>
        )}
      </div>

      {errors[firstField]?.message && (
        <Alert className="w-full">{errors[firstField]!.message as string}</Alert>
      )}
    </form>
  )
}
