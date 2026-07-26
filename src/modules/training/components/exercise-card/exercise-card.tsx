'use client'

import React, { useState } from 'react'
import { SeriesForm } from '@/modules/training/components/series-form'
import { getTrackingFields, type MetricField } from '@/modules/training/exercises'
import { getExerciseName, type Exercise } from '@/modules/training/plans'
import type { SetLog } from '@/payload-types'
import {
  toMetricFormValues,
  type MetricFormValues,
} from '@/modules/training/logs'
import { AddSetActions } from './components/add-set-actions'
import { ExerciseHeader } from './components/exercise-header'
import { ExerciseNote } from './components/exercise-note'
import { MetaLine } from './components/meta-line'
import { SeriesList } from './components/series-list'

export function ExerciseCard({
  exercise,
  sets,
  clientNote = '',
  onAdd,
  onUpdate,
  onDelete,
  onSaveNote,
  readOnly,
}: {
  exercise: Exercise
  sets: SetLog[]
  clientNote?: string
  onAdd?: (exercise: Exercise, fields: MetricField[], values: MetricFormValues) => Promise<void>
  onUpdate?: (id: number, fields: MetricField[], values: MetricFormValues) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onSaveNote?: (exercise: Exercise, note: string) => Promise<void>
  readOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const fields: MetricField[] =
    exercise.targetType === 'duration'
      ? ['weightLeft', 'weightRight', 'durationSec']
      : getTrackingFields(exercise.exercise?.trackingType)
  const prefillValues: MetricFormValues = {
    repsLeft: exercise.repsLeft ?? '',
    repsRight: exercise.repsRight ?? '',
    note: '',
  }
  const name = getExerciseName(exercise)
  const note = exercise.exercise && exercise.note !== name ? exercise.note : null

  return (
    <div className="border-t border-ui-border-base py-2.5 first:border-t-0 first:pt-0 last:pb-0">
      <ExerciseHeader
        numer={exercise.numer}
        name={name}
        videoUrl={exercise.exercise?.videoUrl}
      />

      {exercise.meta.length > 0 && <MetaLine>{exercise.meta.join(' · ')}</MetaLine>}
      {note && <MetaLine>{note}</MetaLine>}

      <SeriesList sets={sets} fields={fields} onUpdate={onUpdate} onDelete={onDelete} readOnly={readOnly} />

      {!readOnly &&
        (open ? (
          <SeriesForm
            fields={fields}
            initial={prefillValues}
            onSubmit={async (values) => {
              await onAdd?.(exercise, fields, values)
              setOpen(false)
            }}
            onCancel={() => setOpen(false)}
          />
        ) : (
          <AddSetActions
            onAdd={() => setOpen(true)}
            onDuplicate={
              sets.length > 0 ? () => onAdd?.(exercise, fields, toMetricFormValues(sets.at(-1)!, fields)) : undefined
            }
          />
        ))}

      <ExerciseNote
        note={clientNote}
        readOnly={readOnly}
        onSave={(note) => onSaveNote!(exercise, note)}
      />
    </div>
  )
}
