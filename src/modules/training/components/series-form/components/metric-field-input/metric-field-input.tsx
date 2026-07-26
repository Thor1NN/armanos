'use client'

import React from 'react'
import type { Control, RegisterOptions, UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { METRIC_FIELDS, type MetricField } from '@/modules/training/exercises'
import {
  getMetricMinutesField,
  getMetricSecondsField,
  getMetricUnitField,
  type MetricFormValues,
} from '@/modules/training/logs'

export function MetricFieldInput({
  field,
  isFirst,
  autoFocus,
  register,
  control,
  validate,
}: {
  field: MetricField
  isFirst: boolean
  autoFocus: boolean
  register: UseFormRegister<MetricFormValues>
  control: Control<MetricFormValues>
  validate: () => true | string
}) {
  const meta = METRIC_FIELDS[field]
  const firstFieldOptions: RegisterOptions<MetricFormValues> = isFirst ? { validate } : {}

  if (meta.composite === 'duration') {
    const minutesField = getMetricMinutesField(field)
    const secondsField = getMetricSecondsField(field)
    return (
      <>
        <Field label="Duration (min)">
          <Input
            variant="compact"
            type="number"
            min={0}
            step={1}
            placeholder="min"
            autoFocus={autoFocus}
            {...register(minutesField, firstFieldOptions)}
          />
        </Field>
        <Field label="Duration (s)">
          <Input
            variant="compact"
            type="number"
            min={0}
            max={59}
            step={1}
            placeholder="s"
            {...register(secondsField)}
          />
        </Field>
      </>
    )
  }

  if (meta.units) {
    return (
      <Field label={meta.label}>
        <span className="inline-flex items-stretch gap-1">
          <Input
            variant="compact-unit"
            type="number"
            step="any"
            placeholder={meta.placeholder}
            autoFocus={autoFocus}
            {...register(field, firstFieldOptions)}
          />
          <Controller
            name={getMetricUnitField(field)}
            control={control}
            defaultValue={meta.units.default}
            render={({ field: unitField }) => (
              <Select {...unitField}>
                {meta.units!.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          />
        </span>
      </Field>
    )
  }

  return (
    <Field label={meta.label}>
      <Input
        variant="compact"
        type={meta.numeric ? 'number' : 'text'}
        step={meta.numeric ? '0.5' : undefined}
        placeholder={meta.placeholder}
        autoFocus={autoFocus}
        {...register(field, firstFieldOptions)}
      />
    </Field>
  )
}
