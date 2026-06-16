'use client'

import React, { useState } from 'react'
import { mutedTextClass, panelClass, sectionLabelClass } from '@/lib/class-names'
import { Alert } from '@/components/ui/alert'
import { ExerciseCard } from '@/components/workout/exercise-card'
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
  const { session, hasLoaded, error, clearError, setsForRow, setTime, saveTimes, addSet, updateSet, deleteSet } =
    useWorkoutSession(workout, { readOnly, showResults })
  const [timeEditorOpen, setTimeEditorOpen] = useState(false)

  return (
    <div className={`mb-3 px-4 py-3 ${panelClass}`}>
      <div className="flex items-center justify-between gap-3 border-b border-ui-border-base pb-2.5 text-sm font-semibold text-ui-fg-base">
        <span>
          <span className="break-words">{workout.title}</span>
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

      {hasLoaded && !session && (
        <div className={`mt-3 text-xs ${mutedTextClass}`}>
          Brak zapisanych serii dla tego treningu. Dodanie pierwszej serii utworzy sesję automatycznie.
        </div>
      )}

      {workout.sections.map((section, sectionIndex) => (
        <div className="mt-3" key={sectionIndex}>
          {(section.title || section.subtitle) && (
            <div className="mb-2 text-sm font-semibold text-ui-fg-interactive">
              {section.title}
              {section.subtitle ? ` · ${section.subtitle}` : ''}
            </div>
          )}
          {section.groups.map((group, groupIndex) => (
            <div className="my-2 mb-3" key={groupIndex}>
              {group.label && <div className={`mb-1 ${sectionLabelClass}`}>{group.label}</div>}
              {group.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.rowId}
                  ex={exercise}
                  sets={setsForRow(exercise.rowId)}
                  onAdd={addSet}
                  onUpdate={updateSet}
                  onDelete={deleteSet}
                  readOnly={readOnly}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
