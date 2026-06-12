'use client'

import React, { useState } from 'react'
import { trackingFields, type MetricField } from '../../../../trackingTypes'
import { dashedButtonClass, mutedTextClass } from '../../ui'
import { SetForm } from './SetForm'
import { SetItem } from './SetItem'
import type { SetLog, TExercise, Values } from './types'

export function ExerciseRow({
  ex,
  sets,
  onAdd,
  onUpdate,
  onDelete,
}: {
  ex: TExercise
  sets: SetLog[]
  onAdd: (ex: TExercise, fields: MetricField[], v: Values) => Promise<void>
  onUpdate: (id: number, fields: MetricField[], v: Values) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const fields = trackingFields(ex.trackingType)

  return (
    <div className="border-t border-app-border py-2 first:border-t-0">
      <div className="break-words text-sm text-app-text">
        {ex.numer ? (
          <span className={`inline-block min-w-[26px] font-semibold ${mutedTextClass}`}>{ex.numer}</span>
        ) : null}
        {ex.name}
        {ex.videoUrl && (
          <a
            className="ml-2 whitespace-nowrap text-xs text-app-accent"
            href={ex.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            ▶ wideo
          </a>
        )}
      </div>

      {ex.meta.length > 0 && (
        <div className={`mt-0.5 pl-[26px] text-xs ${mutedTextClass}`}>{ex.meta.join(' · ')}</div>
      )}
      {ex.note && <div className={`mt-0.5 pl-[26px] text-xs ${mutedTextClass}`}>{ex.note}</div>}

      {sets.length > 0 && (
        <ul className="mt-2 mb-1 list-none p-0">
          {sets.map((s) => (
            <SetItem key={s.id} set={s} fields={fields} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </ul>
      )}

      {open ? (
        <SetForm
          fields={fields}
          initial={{ reps: ex.prefill.reps ?? '', rir: ex.prefill.rir ?? '', note: '' }}
          onSubmit={async (v) => {
            await onAdd(ex, fields, v)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      ) : (
        <button className={`mt-1.5 ${dashedButtonClass}`} onClick={() => setOpen(true)}>
          + dodaj serię
        </button>
      )}
    </div>
  )
}
