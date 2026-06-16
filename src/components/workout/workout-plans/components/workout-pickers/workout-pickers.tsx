'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import type { TPlanAccordionItem } from '@/types/plan'
import type { TWorkout } from '@/types/workout'

type Microcycle = TPlanAccordionItem['microcycles'][number]
type Id = number | string | null | undefined

export function MicrocyclePicker({
  microcycles,
  activeMicrocycleId,
  onSelect,
}: {
  microcycles: Microcycle[]
  activeMicrocycleId: Id
  onSelect: (microcycleId: Microcycle['id']) => void
}) {
  return (
    <div className="flex gap-1.5">
      {microcycles.map((microcycle, index) => (
        <Button
          key={microcycle.id}
          size="sm"
          variant={microcycle.id === activeMicrocycleId ? 'primary' : 'secondary'}
          className="flex-1"
          onClick={() => onSelect(microcycle.id)}
        >
          M{index + 1}({microcycle.workouts.length})
        </Button>
      ))}
    </div>
  )
}

export function WorkoutPicker({
  workouts,
  activeWorkoutId,
  onSelect,
}: {
  workouts: TWorkout[]
  activeWorkoutId: Id
  onSelect: (workoutId: TWorkout['id']) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {workouts.map((workout) => (
        <Button
          key={workout.id}
          size="sm"
          variant="secondary"
          active={workout.id === activeWorkoutId}
          onClick={() => onSelect(workout.id)}
        >
          {workout.title}
        </Button>
      ))}
    </div>
  )
}
