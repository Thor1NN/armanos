'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { X } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { METRIC_FIELDS, type MetricField } from '@/collections/exercises/types'
import { BODYWEIGHT_KEY, minKey, secKey } from '@/lib/metric-keys'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Values } from '@/types/workout'
import { MetricFieldInput } from './components/metric-field-input'

export function SeriesForm({
  fields,
  initial,
  onSubmit,
  onCancel,
}: {
  fields: MetricField[]
  initial: Values
  onSubmit: (v: Values) => Promise<void>
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
  } = useForm<Values>({ defaultValues: initial })

  const isBodyweight = useWatch({ control, name: BODYWEIGHT_KEY }) === 'true'
  const toggleBodyweight = useCallback(() => {
    setValue(BODYWEIGHT_KEY, isBodyweight ? 'false' : 'true')
    if (!isBodyweight) setValue('weight', '')
  }, [isBodyweight, setValue])

  const validateAtLeastOne = () => {
    const values = getValues()
    const filled = fields.some((field) => {
      const meta = METRIC_FIELDS[field]
      if (meta.composite === 'duration') {
        return (values[minKey(field)] ?? '').trim() !== '' || (values[secKey(field)] ?? '').trim() !== ''
      }
      return (values[field] ?? '').trim() !== ''
    })
    return filled || t('atLeastOneValue')
  }

  const submit = handleSubmit(async (data) => {
    await onSubmit(data)
  })

  const firstField = fields[0]

  return (
    <form className="mt-1.5 flex flex-col gap-2" onSubmit={submit} noValidate>
      <div className="flex flex-wrap gap-2">
        {fields.map((field, index) => (
          <MetricFieldInput
            key={field}
            field={field}
            isFirst={field === firstField}
            autoFocus={index === 0}
            initial={initial}
            register={register}
            control={control}
            setValue={setValue}
            validate={validateAtLeastOne}
            isBodyweight={isBodyweight}
            onToggleBodyweight={toggleBodyweight}
          />
        ))}
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
