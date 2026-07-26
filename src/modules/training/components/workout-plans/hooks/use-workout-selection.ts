'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { MicrocycleTree, PlanTree, WorkoutTree } from '@/modules/training/plans'

const STORAGE_KEY = 'training-app:active-workout-selection'
const SSR_SNAPSHOT = '__SSR_SELECTION__'

type WorkoutSelection = {
  planId: number | string | null
  microcycleId: number | string | null
  workoutId: number | string | null
}

const subscribeToSelection = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}

const firstAvailableSelection = (plans: PlanTree[]): WorkoutSelection => {
  const plan = plans[0]
  const microcycle = plan?.microcycles[0]
  const workout = microcycle?.workouts[0]

  return {
    microcycleId: microcycle?.id ?? null,
    planId: plan?.id ?? null,
    workoutId: workout?.id ?? null,
  }
}

const isValidSelection = (plans: PlanTree[], selection: WorkoutSelection) => {
  const plan = plans.find((item) => item.id === selection.planId)
  if (!plan) return false

  const microcycle = plan.microcycles.find((item) => item.id === selection.microcycleId)
  if (!microcycle) return false

  return microcycle.workouts.some((item) => item.id === selection.workoutId)
}

export function useWorkoutSelection(
  plans: PlanTree[],
  options: { readOnly?: boolean },
): {
  resolvedSelection: WorkoutSelection
  activePlan: PlanTree | null
  activeMicrocycle: MicrocycleTree | null
  activeWorkout: WorkoutTree | null
  selectPlan: (plan: PlanTree) => void
  selectMicrocycle: (plan: PlanTree, microcycleId: number | string) => void
  selectWorkout: (workoutId: number | string) => void
} {
  const { readOnly } = options
  const initialSelection = useMemo(() => firstAvailableSelection(plans), [plans])
  const [selection, setSelection] = useState<WorkoutSelection | null>(null)
  const storedSelectionRaw = useSyncExternalStore(
    subscribeToSelection,
    () => (readOnly ? SSR_SNAPSHOT : window.localStorage.getItem(STORAGE_KEY)),
    () => SSR_SNAPSHOT,
  )
  const storedSelection = useMemo(() => {
    if (storedSelectionRaw === SSR_SNAPSHOT || !storedSelectionRaw) return initialSelection

    try {
      return JSON.parse(storedSelectionRaw) as WorkoutSelection
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      return initialSelection
    }
  }, [initialSelection, storedSelectionRaw])

  const preferredSelection = selection ?? storedSelection
  const resolvedSelection = isValidSelection(plans, preferredSelection)
    ? preferredSelection
    : initialSelection

  useEffect(() => {
    if (readOnly) return
    if (storedSelectionRaw === SSR_SNAPSHOT) return
    if (!isValidSelection(plans, resolvedSelection)) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedSelection))
  }, [plans, readOnly, resolvedSelection, storedSelectionRaw])

  const selectPlan = (plan: PlanTree) => {
    const nextMicrocycle = plan.microcycles[0] ?? null
    const nextWorkout = nextMicrocycle?.workouts[0] ?? null
    setSelection({
      planId: plan.id,
      microcycleId: nextMicrocycle?.id ?? null,
      workoutId: nextWorkout?.id ?? null,
    })
  }

  const selectMicrocycle = (plan: PlanTree, microcycleId: number | string) => {
    const microcycle = plan.microcycles.find((item) => item.id === microcycleId) ?? null
    const nextWorkout = microcycle?.workouts[0] ?? null
    setSelection({
      planId: plan.id,
      microcycleId,
      workoutId: nextWorkout?.id ?? null,
    })
  }

  const selectWorkout = (workoutId: number | string) => {
    setSelection({ ...resolvedSelection, workoutId })
  }

  const activePlan = plans.find((plan) => plan.id === resolvedSelection.planId) ?? null
  const activeMicrocycle =
    activePlan?.microcycles.find(
      (microcycle) => microcycle.id === resolvedSelection.microcycleId,
    ) ?? null
  const activeWorkout =
    activeMicrocycle?.workouts.find((workout) => workout.id === resolvedSelection.workoutId) ?? null

  return {
    resolvedSelection,
    activePlan,
    activeMicrocycle,
    activeWorkout,
    selectPlan,
    selectMicrocycle,
    selectWorkout,
  }
}
