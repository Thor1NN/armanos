'use client'

import React from 'react'
import type { MetricField } from '@/collections/exercises/types'
import { SeriesRow } from '@/components/workout/series-row'
import type { SetLog, Values } from '@/types/workout'

export function SeriesList({
  sets,
  fields,
  onUpdate,
  onDelete,
  readOnly,
}: {
  sets: SetLog[]
  fields: MetricField[]
  onUpdate?: (id: number, fields: MetricField[], values: Values) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  readOnly?: boolean
}) {
  if (sets.length === 0) return null

  return (
    <ul className="mt-2 mb-1 list-none p-0">
      {sets.map((set) => (
        <SeriesRow
          key={set.id}
          set={set}
          fields={fields}
          onUpdate={async (values) => {
            await onUpdate?.(set.id, fields, values)
          }}
          onDelete={async () => {
            await onDelete?.(set.id)
          }}
          readOnly={readOnly}
        />
      ))}
    </ul>
  )
}
