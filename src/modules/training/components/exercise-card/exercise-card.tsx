'use client'

import { useTranslations } from 'next-intl'
import React, { useRef, useState } from 'react'
import { SeriesForm } from '@/modules/training/components/series-form'
import { getTrackingFields, type MetricField } from '@/modules/training/exercises'
import { getExerciseName, type WorkoutExerciseTree } from '@/modules/training/plans'
import type { SetLog } from '@/payload-types'
import {
  formatSetLogSummary,
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
  prevSets = [],
  clientNote = '',
  onUpsert,
  onUpdate,
  onDelete,
  onSaveNote,
  onSetLogged,
  readOnly,
}: {
  exercise: WorkoutExerciseTree
  sets: SetLog[]
  /** The same exercise row's sets from the previous completed session. */
  prevSets?: SetLog[]
  clientNote?: string
  onUpsert?: (
    exercise: WorkoutExerciseTree,
    fields: MetricField[],
    values: MetricFormValues,
    setNumber?: number,
  ) => Promise<number | null>
  onUpdate?: (id: number, fields: MetricField[], values: MetricFormValues) => Promise<unknown>
  onDelete?: (id: number) => Promise<unknown>
  onSaveNote?: (exercise: WorkoutExerciseTree, note: string) => Promise<unknown>
  /** Called after a set is logged — starts the rest timer. */
  onSetLogged?: (exercise: WorkoutExerciseTree) => void
  readOnly?: boolean
}) {
  const t = useTranslations('exercise')
  const [open, setOpen] = useState(false)
  // The set number reserved by the first autosave of the open form, so every
  // subsequent autosave updates the same row instead of appending new ones.
  const draftSetNumber = useRef<number | null>(null)
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

  const saveDraft = async (values: MetricFormValues): Promise<number | null> => {
    const savedNumber = await onUpsert?.(
      exercise,
      fields,
      values,
      draftSetNumber.current ?? undefined,
    )
    if (savedNumber != null) draftSetNumber.current = savedNumber
    return savedNumber ?? null
  }

  return (
    <div className="border-t border-ui-border-base py-2.5 first:border-t-0 first:pt-0 last:pb-0">
      <ExerciseHeader
        numer={exercise.numer}
        name={name}
        videoUrl={exercise.exercise?.videoUrl}
      />

      {exercise.meta.length > 0 && <MetaLine>{exercise.meta.join(' · ')}</MetaLine>}
      {note && <MetaLine>{note}</MetaLine>}
      {prevSets.length > 0 && (
        <MetaLine>
          {t('previousSession')}: {prevSets.map((set) => formatSetLogSummary(set)).join(' | ')}
        </MetaLine>
      )}

      <SeriesList
        sets={sets}
        fields={fields}
        onUpdate={
          onUpdate
            ? async (id, updateFields, values) => {
                await onUpdate(id, updateFields, values)
              }
            : undefined
        }
        onDelete={
          onDelete
            ? async (id) => {
                await onDelete(id)
              }
            : undefined
        }
        readOnly={readOnly}
      />

      {!readOnly &&
        (open ? (
          <SeriesForm
            fields={fields}
            initial={prefillValues}
            onAutosave={async (values) => {
              await saveDraft(values)
            }}
            onSubmit={async (values) => {
              const saved = await saveDraft(values)
              draftSetNumber.current = null
              setOpen(false)
              if (saved != null) onSetLogged?.(exercise)
            }}
            onCancel={() => {
              draftSetNumber.current = null
              setOpen(false)
            }}
          />
        ) : (
          <AddSetActions
            onAdd={() => {
              draftSetNumber.current = null
              setOpen(true)
            }}
            onDuplicate={
              sets.length > 0
                ? async () => {
                    const saved = await onUpsert?.(
                      exercise,
                      fields,
                      toMetricFormValues(sets.at(-1)!, fields),
                    )
                    if (saved != null) onSetLogged?.(exercise)
                  }
                : undefined
            }
          />
        ))}

      <ExerciseNote
        note={clientNote}
        readOnly={readOnly}
        onSave={async (note) => {
          await onSaveNote!(exercise, note)
        }}
      />
    </div>
  )
}
