'use client'

import React, { useState } from 'react'
import { METRIC_FIELDS, type MetricField } from '../../../../trackingTypes'
import { dangerIconButtonClass, iconButtonClass, joinClasses, panelClass } from '../../ui'
import { SetForm } from './SetForm'
import type { SetLog, Values } from './types'
import { setSummary, toDefaultUnit } from './utils'

export function SetItem({
  set,
  fields,
  onUpdate,
  onDelete,
}: {
  set: SetLog
  fields: MetricField[]
  onUpdate: (id: number, fields: MetricField[], v: Values) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    const initial: Values = { note: set.note ?? '' }

    for (const f of fields) {
      const v = (set as Record<string, unknown>)[f]
      if (v == null) {
        initial[f] = ''
      } else if (METRIC_FIELDS[f].composite === 'duration') {
        const base = Number(v)
        initial[`${f}__min`] = String(Math.floor(base / 60))
        initial[`${f}__sec`] = String(base % 60)
      } else if (METRIC_FIELDS[f].units) {
        const conv = toDefaultUnit(f, Number(v))
        initial[f] = conv.value
        initial[`${f}__unit`] = conv.unit
      } else {
        initial[f] = String(v)
      }
    }

    return (
      <li className={`px-2.5 py-2 ${joinClasses(panelClass, 'rounded-lg bg-app-bg')}`}>
        <SetForm
          fields={fields}
          initial={initial}
          onSubmit={async (v) => {
            await onUpdate(set.id, fields, v)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="mb-1 flex items-center justify-between gap-2 rounded-lg border border-app-border bg-app-bg px-2.5 py-1.5 text-sm">
      <span>
        Seria {set.setNumber}: {setSummary(set)}
      </span>
      <span className="flex shrink-0 gap-0.5">
        <button className={iconButtonClass} onClick={() => setEditing(true)} aria-label="Edytuj">
          ✎
        </button>
        <button className={dangerIconButtonClass} onClick={() => onDelete(set.id)} aria-label="Usuń">
          ✕
        </button>
      </span>
    </li>
  )
}
