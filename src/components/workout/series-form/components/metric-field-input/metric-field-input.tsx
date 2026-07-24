'use client'

import React from 'react'
import type { Control, RegisterOptions, UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { METRIC_FIELDS, type MetricField } from '@/collections/exercises/types'
import { minKey, secKey, unitKey } from '@/lib/metric-keys'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import type { Values } from '@/types/workout'

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
  register: UseFormRegister<Values>
  control: Control<Values>
  validate: () => true | string
}) {
  const meta = METRIC_FIELDS[field]
  const firstFieldOptions: RegisterOptions<Values> = isFirst ? { validate } : {}

  if (meta.composite === 'duration') {
    const minName = minKey(field) as keyof Values
    const secName = secKey(field) as keyof Values
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
            {...register(minName, firstFieldOptions)}
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
            {...register(secName)}
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
            name={unitKey(field) as keyof Values}
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
