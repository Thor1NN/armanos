'use client'

import React, { useState } from 'react'
import type { MetricField } from '../../../../trackingTypes'
import { joinClasses, panelClass } from '../../ui'
import { Button } from '../ui/Button'
import { SeriesForm } from './SeriesForm'
import type { SetLog, Values } from './types'
import { setLogToFormValues, setSummary } from '../../utils/metrics'

export function SeriesRow({
  set,
  fields,
  onUpdate,
  onDelete,
}: {
  set: SetLog
  fields: MetricField[]
  onUpdate: (values: Values) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <li className={`px-2.5 py-2 ${joinClasses(panelClass, 'rounded-lg bg-app-bg')}`}>
        <SeriesForm
          fields={fields}
          initial={setLogToFormValues(set, fields)}
          onSubmit={async (v) => {
            await onUpdate(v)
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
        <Button variant="icon" onClick={() => setEditing(true)} aria-label="Edytuj">
          ✎
        </Button>
        <Button variant="danger" onClick={onDelete} aria-label="Usuń">
          ✕
        </Button>
      </span>
    </li>
  )
}
