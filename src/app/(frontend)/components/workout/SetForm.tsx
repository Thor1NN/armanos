'use client'

import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { METRIC_FIELDS, type MetricField } from '../../../../trackingTypes'
import { errorBannerClass } from '../../ui'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'
import type { Values } from './types'

export function SetForm({
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
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: initial })

  const validateAtLeastOne = () => {
    const vals = getValues()
    const filled = fields.some((f) => {
      const meta = METRIC_FIELDS[f]
      if (meta.composite === 'duration') {
        return (vals[`${f}__min`] ?? '').trim() !== '' || (vals[`${f}__sec`] ?? '').trim() !== ''
      }
      return (vals[f] ?? '').trim() !== ''
    })
    return filled || 'Podaj co najmniej jedną wartość'
  }

  const submit = handleSubmit(async (data) => {
    await onSubmit(data)
  })

  const firstField = fields[0]

  return (
    <form className="mt-1.5 flex flex-wrap gap-1.5" onSubmit={submit} noValidate>
      {fields.map((f, i) => {
        const meta = METRIC_FIELDS[f]
        const isFirst = f === firstField

        if (meta.composite === 'duration') {
          return (
            <span className="inline-flex items-stretch gap-1" key={f}>
              <Input
                variant="compact-unit"
                type="number"
                min="0"
                placeholder="min"
                autoFocus={i === 0}
                {...register(`${f}__min`, isFirst ? { validate: validateAtLeastOne } : {})}
              />
              <span className="flex items-center text-xs text-app-muted">min</span>
              <Input
                variant="compact-unit"
                type="number"
                min="0"
                max="59"
                placeholder="sek"
                {...register(`${f}__sec`)}
              />
              <span className="flex items-center text-xs text-app-muted">sek</span>
            </span>
          )
        }

        if (meta.units) {
          return (
            <span className="inline-flex items-stretch gap-1" key={f}>
              <Input
                variant="compact-unit"
                type="number"
                step="any"
                placeholder={meta.placeholder}
                autoFocus={i === 0}
                {...register(f, isFirst ? { validate: validateAtLeastOne } : {})}
              />
              <Controller
                name={`${f}__unit`}
                control={control}
                defaultValue={meta.units.default}
                render={({ field }) => (
                  <Select {...field}>
                    {meta.units!.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </span>
          )
        }

        return (
          <Input
            key={f}
            variant="compact"
            type={meta.numeric ? 'number' : 'text'}
            step={meta.numeric ? '0.5' : undefined}
            placeholder={meta.placeholder}
            autoFocus={i === 0}
            {...register(f, isFirst ? { validate: validateAtLeastOne } : {})}
          />
        )
      })}

      <Input
        className="min-w-24 flex-1"
        type="text"
        placeholder="notatka"
        {...register('note')}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '…' : 'Zapisz'}
      </Button>
      {onCancel && (
        <Button variant="secondary" type="button" onClick={onCancel}>
          Anuluj
        </Button>
      )}

      {errors[firstField]?.message && (
        <div className={`w-full ${errorBannerClass}`} role="alert">
          {errors[firstField]!.message as string}
        </div>
      )}
    </form>
  )
}
