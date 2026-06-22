'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { mutedTextClass, panelClass, sectionLabelClass } from '@/lib/class-names'
import { Alert } from '@/components/ui/alert'
import { ExerciseCard } from '@/components/workout/exercise-card'
import { NoteField } from '@/components/workout/note-field'
import { SessionTimesBadge, SessionTimesForm } from '@/components/workout/session-times'
import type { TWorkout } from '@/types/workout'
import { useWorkoutSession } from './hooks/use-workout-session'

export function WorkoutTracker({
  workout,
  readOnly,
  showResults,
}: {
  workout: TWorkout
  readOnly?: boolean
  showResults?: boolean
}) {
  const { session, error, clearError, setsForRow, noteForRow, setTime, saveTimes, addSet, updateSet, deleteSet, saveExerciseNote, saveSessionNote } =
    useWorkoutSession(workout, { readOnly, showResults })
  const [timeEditorOpen, setTimeEditorOpen] = useState(false)
  const t = useTranslations('session')
  const sessionNote = session?.notes ?? ''

  return (
    <div className={`mb-3 px-4 py-3 ${panelClass}`}>
      <div className="-mx-4 flex items-center justify-between gap-2.5 border-b border-ui-border-base px-4 pb-2.5 text-sm font-semibold text-ui-fg-base">
        <span>
          <span className="break-words">{workout.title}</span>
          <span className={mutedTextClass}> · #{workout.id}</span>
          {workout.rpe != null && <span className={mutedTextClass}> · RPE {workout.rpe}</span>}
        </span>
        {!readOnly && (
          <SessionTimesBadge
            session={session}
            open={timeEditorOpen}
            onOpen={() => setTimeEditorOpen((prev) => !prev)}
          />
        )}
      </div>

      {!readOnly && timeEditorOpen && (
        <SessionTimesForm
          key={session?.id ?? 'new'}
          session={session}
          onSet={setTime}
          onSave={saveTimes}
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
                    {group.label && <div className={`mb-1 ${sectionLabelClass}`}>{group.label}</div>}
                    {group.exercises.map((exercise) => (
                      <ExerciseCard
                        key={exercise.rowId}
                        exercise={exercise}
                        sets={setsForRow(exercise.rowId)}
                        clientNote={noteForRow(exercise.rowId)}
                        onAdd={addSet}
                        onUpdate={updateSet}
                        onDelete={deleteSet}
                        onSaveNote={saveExerciseNote}
                        readOnly={readOnly}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}

      {(!readOnly || sessionNote) && (
        <div className="-mx-4 border-t border-ui-border-base px-4 pt-2.5">
          <NoteField
            note={sessionNote}
            readOnly={readOnly}
            onSave={saveSessionNote}
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
    </div>
  )
}
