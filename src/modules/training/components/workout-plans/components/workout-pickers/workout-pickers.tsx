'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import type { MicrocycleTree, WorkoutTree } from '@/modules/training/plans'

type Id = number | string | null | undefined

export function MicrocyclePicker({
  microcycles,
  activeMicrocycleId,
  onSelect,
}: {
  microcycles: MicrocycleTree[]
  activeMicrocycleId: Id
  onSelect: (microcycleId: MicrocycleTree['id']) => void
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
  workouts: WorkoutTree[]
  activeWorkoutId: Id
  onSelect: (workoutId: WorkoutTree['id']) => void
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
