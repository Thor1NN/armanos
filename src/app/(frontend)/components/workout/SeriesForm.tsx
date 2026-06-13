'use client'

import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { METRIC_FIELDS, type MetricField } from '../../../../trackingTypes'
import { errorBannerClass, mutedTextClass } from '../../ui'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'
import type { Values } from '../../types/types'

function parseMmSs(raw: string): { min: string; sec: string } {
  const clean = raw.replace(/[^\d:]/g, '')
  if (clean.includes(':')) {
    const [m, s] = clean.split(':')
    return { min: m ?? '', sec: s ?? '' }
  }
  if (clean.length <= 2) return { min: clean, sec: '' }
  // e.g. "530" → 5min 30sec
  return { min: clean.slice(0, -2), sec: clean.slice(-2) }
}

function formatMmSs(min: string, sec: string): string {
  if (!min && !sec) return ''
  return `${String(min || '0').padStart(2, '0')}:${String(sec || '0').padStart(2, '0')}`
}

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
      onChange={(e) => setDisplay(e.target.value)}
      onBlur={handleBlur}
    />
  )
}

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
  const {
    register,
    control,
    handleSubmit,
    setValue,
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
    <form className="mt-1.5 flex flex-col gap-2" onSubmit={submit} noValidate>
      <div className="flex flex-wrap gap-2">
        {fields.map((f, i) => {
          const meta = METRIC_FIELDS[f]
          const isFirst = f === firstField

          if (meta.composite === 'duration') {
            const minKey = `${f}__min` as keyof Values
            const secKey = `${f}__sec` as keyof Values
            return (
              <div className="flex flex-col gap-1" key={f}>
                <span className={`text-xs ${mutedTextClass}`}>{meta.label}</span>
                {/* hidden inputs keep RHF validation wired */}
                <input type="hidden" {...register(minKey, isFirst ? { validate: validateAtLeastOne } : {})} />
                <input type="hidden" {...register(secKey)} />
                <DurationInput
                  initialMin={String(initial[minKey] ?? '')}
                  initialSec={String(initial[secKey] ?? '')}
                  autoFocus={i === 0}
                  onCommit={(min, sec) => {
                    setValue(minKey, min)
                    setValue(secKey, sec)
                  }}
                />
              </div>
            )
          }

          if (meta.units) {
            return (
              <div className="flex flex-col gap-1" key={f}>
                <span className={`text-xs ${mutedTextClass}`}>{meta.label}</span>
                <span className="inline-flex items-stretch gap-1">
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
              </div>
            )
          }

          return (
            <div className="flex flex-col gap-1" key={f}>
              <span className={`text-xs ${mutedTextClass}`}>{meta.label}</span>
              <Input
                variant="compact"
                type={meta.numeric ? 'number' : 'text'}
                step={meta.numeric ? '0.5' : undefined}
                placeholder={meta.placeholder}
                autoFocus={i === 0}
                {...register(f, isFirst ? { validate: validateAtLeastOne } : {})}
              />
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-1">
        <span className={`text-xs ${mutedTextClass}`}>Notatka</span>
        <Input className="w-full" type="text" placeholder="notatka" {...register('note')} />
      </div>

      <div className="flex items-center gap-1.5">
        <Button size="sm" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '…' : 'Zapisz'}
        </Button>
        {onCancel && (
          <Button size="sm" variant="secondary" type="button" onClick={onCancel} aria-label="Anuluj">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </Button>
        )}
      </div>

      {errors[firstField]?.message && (
        <div className={`w-full ${errorBannerClass}`} role="alert">
          {errors[firstField]!.message as string}
        </div>
      )}
    </form>
  )
}
