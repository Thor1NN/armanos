'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import type { Control, RegisterOptions, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { METRIC_FIELDS, type MetricField } from '@/collections/exercises/types'
import { mutedTextClass } from '@/lib/class-names'
import { formatMmSs, parseMmSs } from '@/lib/date'
import { minKey, secKey, unitKey } from '@/lib/metric-keys'
import { Input, Select } from '@/components/ui/input'
import type { Values } from '@/types/workout'

function DurationInput({
  initialMin,
  initialSec,
  autoFocus,
  onCommit,
  className,
}: {
  initialMin: string
  initialSec: string
  autoFocus?: boolean
  onCommit: (min: string, sec: string) => void
  className?: string
}) {
  const [display, setDisplay] = useState(() => formatMmSs(initialMin, initialSec))

  const handleBlur = () => {
    const { min, sec } = parseMmSs(display)
    const formatted = formatMmSs(min, sec)
    setDisplay(formatted)
    onCommit(min, sec)
  }

  return (
    <Input
      variant="compact"
      type="text"
      inputMode="numeric"
      placeholder="00:00"
      autoFocus={autoFocus}
      value={display}
      className={className}
      onChange={(event) => setDisplay(event.target.value)}
      onBlur={handleBlur}
    />
  )
}

function FieldWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-xs ${mutedTextClass}`}>{label}</span>
      {children}
    </div>
  )
}

export function MetricFieldInput({
  field,
  isFirst,
  autoFocus,
  initial,
  register,
  control,
  setValue,
  validate,
  isBodyweight,
  onToggleBodyweight,
}: {
  field: MetricField
  isFirst: boolean
  autoFocus: boolean
  initial: Values
  register: UseFormRegister<Values>
  control: Control<Values>
  setValue: UseFormSetValue<Values>
  validate: () => true | string
  isBodyweight: boolean
  onToggleBodyweight: () => void
}) {
  const t = useTranslations('seriesForm')
  const meta = METRIC_FIELDS[field]
  const firstFieldOptions: RegisterOptions<Values> = isFirst ? { validate } : {}

  if (meta.composite === 'duration') {
    const minName = minKey(field) as keyof Values
    const secName = secKey(field) as keyof Values
    return (
      <FieldWrapper label={meta.label}>
        <input type="hidden" {...register(minName, firstFieldOptions)} />
        <input type="hidden" {...register(secName)} />
        <DurationInput
          initialMin={String(initial[minName] ?? '')}
          initialSec={String(initial[secName] ?? '')}
          autoFocus={autoFocus}
          onCommit={(min, sec) => {
            setValue(minName, min)
            setValue(secName, sec)
          }}
        />
      </FieldWrapper>
    )
  }

  if (meta.units) {
    return (
      <FieldWrapper label={meta.label}>
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
      </FieldWrapper>
    )
  }

  if (field === 'weight') {
    return (
      <FieldWrapper label={meta.label}>
        {isBodyweight ? (
          <button
            type="button"
            onClick={onToggleBodyweight}
            className={`h-8 rounded-md border border-ui-border-base bg-ui-bg-subtle px-2.5 text-xs ${mutedTextClass} text-left`}
          >
            {t('bodyweightActive')}
          </button>
        ) : (
          <span className="inline-flex items-stretch gap-1">
            <Input
              variant="compact"
              type="number"
              step="0.5"
              placeholder={meta.placeholder}
              autoFocus={autoFocus}
              {...register(field, firstFieldOptions)}
            />
            <button
              type="button"
              onClick={onToggleBodyweight}
              title={t('bodyweightTitle')}
              className={`rounded-md border border-ui-border-base bg-ui-bg-subtle px-2 text-xs ${mutedTextClass} hover:bg-ui-bg-base-hover`}
            >
              MC
            </button>
          </span>
        )}
        <input type="hidden" {...register('weight__bodyweight')} />
      </FieldWrapper>
    )
  }

  return (
    <FieldWrapper label={meta.label}>
      <Input
        variant="compact"
        type={meta.numeric ? 'number' : 'text'}
        step={meta.numeric ? '0.5' : undefined}
        placeholder={meta.placeholder}
        autoFocus={autoFocus}
        {...register(field, firstFieldOptions)}
      />
    </FieldWrapper>
  )
}
