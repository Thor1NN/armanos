'use client'

import React, { useState } from 'react'
import { METRIC_FIELDS, type MetricField } from '../../../../trackingTypes'
import {
  compactInputClass,
  compactUnitInputClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
} from '../../ui'
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
  const [values, setValues] = useState<Values>(initial)
  const [saving, setSaving] = useState(false)
  const set = (k: string, val: string) => setValues((p) => ({ ...p, [k]: val }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(values)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="mt-1.5 flex flex-wrap gap-1.5" onSubmit={submit}>
      {fields.map((f, i) => {
        const meta = METRIC_FIELDS[f]

        if (meta.composite === 'duration') {
          return (
            <span className="inline-flex items-stretch gap-1" key={f}>
              <input
                className={compactUnitInputClass}
                type="number"
                min="0"
                placeholder="min"
                value={values[`${f}__min`] ?? ''}
                onChange={(e) => set(`${f}__min`, e.target.value)}
                autoFocus={i === 0}
              />
              <span className="flex items-center text-xs text-app-muted">min</span>
              <input
                className={compactUnitInputClass}
                type="number"
                min="0"
                max="59"
                placeholder="sek"
                value={values[`${f}__sec`] ?? ''}
                onChange={(e) => set(`${f}__sec`, e.target.value)}
              />
              <span className="flex items-center text-xs text-app-muted">sek</span>
            </span>
          )
        }

        if (meta.units) {
          const unit = values[`${f}__unit`] ?? meta.units.default
          return (
            <span className="inline-flex items-stretch gap-1" key={f}>
              <input
                className={compactUnitInputClass}
                type="number"
                step="any"
                placeholder={meta.placeholder}
                value={values[f] ?? ''}
                onChange={(e) => set(f, e.target.value)}
                autoFocus={i === 0}
              />
              <select
                className={selectClass}
                value={unit}
                onChange={(e) => set(`${f}__unit`, e.target.value)}
              >
                {meta.units.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </span>
          )
        }

        return (
          <input
            key={f}
            className={compactInputClass}
            type={meta.numeric ? 'number' : 'text'}
            step={meta.numeric ? '0.5' : undefined}
            placeholder={meta.placeholder}
            value={values[f] ?? ''}
            onChange={(e) => set(f, e.target.value)}
            autoFocus={i === 0}
          />
        )
      })}

      <input
        className={`min-w-[90px] flex-1 ${inputClass}`}
        type="text"
        placeholder="notatka"
        value={values.note ?? ''}
        onChange={(e) => set('note', e.target.value)}
      />
      <button className={primaryButtonClass} type="submit" disabled={saving}>
        {saving ? '…' : 'Zapisz'}
      </button>
      {onCancel && (
        <button className={secondaryButtonClass} type="button" onClick={onCancel}>
          Anuluj
        </button>
      )}
    </form>
  )
}
