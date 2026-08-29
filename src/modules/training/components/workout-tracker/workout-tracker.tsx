'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { mutedTextClass, panelClass, sectionLabelClass } from '@/lib/class-names'
import { Alert } from '@/components/ui/alert'
import { ExerciseCard } from '@/modules/training/components/exercise-card'
import { FinishWorkout } from '@/modules/training/components/finish-workout'
import { NoteField } from '@/modules/training/components/note-field'
import { RestTimer } from '@/modules/training/components/rest-timer'
import { SaveStatusChip } from '@/modules/training/components/save-status'
import { SessionTimesBadge, SessionTimesForm } from '@/modules/training/components/session-times'
import type { WorkoutExerciseTree, WorkoutTree } from '@/modules/training/plans'
import { useWorkoutSession } from './hooks/use-workout-session'

const DEFAULT_REST_SECONDS = 90

/** Prescribed rest for a row: protocol override first, then the free-text
 *  `rest` field (seconds; "2 min" style values are converted). */
const parseRestSeconds = (exercise: WorkoutExerciseTree): number => {
  if (exercise.override?.restSeconds != null) return exercise.override.restSeconds
  const text = exercise.rest ?? ''
  const match = text.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return DEFAULT_REST_SECONDS
  const value = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_REST_SECONDS
  return /min/i.test(text) ? Math.round(value * 60) : Math.round(value)
}

export function WorkoutTracker({
  workout,
  readOnly,
  showResults,
}: {
  workout: WorkoutTree
  readOnly?: boolean
  showResults?: boolean
}) {
  const {
    session,
    sessionCompleted,
    error,
    saveStatus,
    clearError,
    setsForRow,
    prevSetsForRow,
    noteForRow,
    setTime,
    saveTimes,
    upsertSet,
    updateSet,
    deleteSet,
    finishWorkout,
    saveExerciseNote,
    saveSessionNote,
  } = useWorkoutSession(workout, { readOnly, showResults })
  const [timeEditorOpen, setTimeEditorOpen] = useState(false)
  const [restTimer, setRestTimer] = useState<{ seconds: number; startedAt: number } | null>(null)
  const t = useTranslations('session')
  const sessionNote = session?.notes ?? ''

  const effectiveReadOnly = readOnly || sessionCompleted

  const handleSetLogged = (exercise: WorkoutExerciseTree) => {
    setRestTimer({ seconds: parseRestSeconds(exercise), startedAt: Date.now() })
  }

  return (
    <div className={`mb-3 px-4 py-3 ${panelClass}`}>
      <div className="-mx-4 flex items-center justify-between gap-2.5 border-b border-ui-border-base px-4 pb-2.5 text-sm font-semibold text-ui-fg-base">
        <span>
          <span className="break-words">{workout.title}</span>
          <span className={mutedTextClass}> · #{workout.id}</span>
          {workout.rpe != null && <span className={mutedTextClass}> · RPE {workout.rpe}</span>}
        </span>
        <span className="flex items-center gap-2">
          {!readOnly && <SaveStatusChip status={saveStatus} />}
          {!readOnly && (
            <SessionTimesBadge
              session={session}
              open={timeEditorOpen}
              onOpen={() => setTimeEditorOpen((prev) => !prev)}
            />
          )}
        </span>
      </div>

      {!effectiveReadOnly && timeEditorOpen && (
        <SessionTimesForm
          key={session?.id ?? 'new'}
          session={session}
          onSet={async (field, iso) => {
            await setTime(field, iso)
          }}
          onSave={async (startedAt, finishedAt) => {
            await saveTimes(startedAt, finishedAt)
          }}
          onClose={() => setTimeEditorOpen(false)}
        />
      )}

      {error && (
        <Alert className="mt-2" onDismiss={clearError}>
          {error}
        </Alert>
      )}

      {workout.sections.map((section, sectionIndex) => (
        <div className="pt-4 pb-2" key={sectionIndex}>
          {(section.title || section.subtitle) && (
            <div className="mb-4 text-sm font-semibold text-ui-fg-interactive leading-1">
              {section.title} {section.subtitle ? ` · ${section.subtitle}` : ''}
            </div>
          )}
          {section.blocks.map((block, blockIndex) => {
            const alt = block.index % 2 === 0
            return (
              <div
                className={`-mx-4 px-4 py-2.5 ${alt ? 'bg-ui-bg-base' : 'bg-ui-bg-component'}`}
                key={blockIndex}
              >
                {block.groups.map((group, groupIndex) => (
                  <div key={groupIndex} className={groupIndex > 0 ? 'mt-2' : undefined}>
                    {(group.label || group.protocolLabel) && (
                      <div className={`mb-1 ${sectionLabelClass}`}>
                        {group.label}
                        {group.label && group.protocolLabel ? ' ' : ''}
                        {group.protocolLabel && (group.label ? `(${group.protocolLabel})` : group.protocolLabel)}
                      </div>
                    )}
                    {group.meta.length > 0 && (
                      <div className="mb-1 text-xs text-ui-fg-muted">{group.meta.join(' · ')}</div>
                    )}
                    {group.exercises.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        sets={setsForRow(exercise.id)}
                        prevSets={prevSetsForRow(exercise.id)}
                        clientNote={noteForRow(exercise.id)}
                        onUpsert={upsertSet}
                        onUpdate={updateSet}
                        onDelete={deleteSet}
                        onSaveNote={saveExerciseNote}
                        onSetLogged={handleSetLogged}
                        readOnly={effectiveReadOnly}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}

      {(!effectiveReadOnly || sessionNote) && (
        <div className="-mx-4 border-t border-ui-border-base px-4 pt-2.5">
          <NoteField
            note={sessionNote}
            readOnly={effectiveReadOnly}
            onSave={async (note) => {
              await saveSessionNote(note)
            }}
            labels={{
              label: t('noteLabel'),
              add: t('addNote'),
              edit: t('editNote'),
              placeholder: t('notePlaceholder'),
              save: t('saveNote'),
              cancel: t('cancelNote'),
            }}
          />
        </div>
      )}

      {!readOnly && (
        <FinishWorkout
          session={session}
          completed={sessionCompleted}
          onFinish={async () => {
            setRestTimer(null)
            await finishWorkout()
          }}
        />
      )}

      {!effectiveReadOnly && restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          startedAt={restTimer.startedAt}
          onDismiss={() => setRestTimer(null)}
        />
      )}
    </div>
  )
}
