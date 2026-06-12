'use client'

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import WorkoutTracker, { type TWorkout } from '../WorkoutTracker'
import { Button } from './ui/Button'
import { StatusBadge } from './ui/StatusBadge'
import { Surface } from './ui/Surface'
import { mutedTextClass, sectionLabelClass } from '../ui'

const STORAGE_KEY = 'training-app:active-workout-selection'
const SSR_SNAPSHOT = '__SSR_SELECTION__'

const subscribeToSelection = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}

export type TPlanAccordionItem = {
  id: number | string
  title: string
  status: string
  statusLabel: string
  dateRange?: string | null
  description?: string | null
  microcycles: Array<{
    id: number | string
    title: string
    rpe?: number | null
    workouts: TWorkout[]
  }>
}

type Selection = {
  planId: number | string | null
  microcycleId: number | string | null
  workoutId: number | string | null
}

const firstAvailableSelection = (plans: TPlanAccordionItem[]) => {
  const plan = plans[0]
  const microcycle = plan?.microcycles[0]
  const workout = microcycle?.workouts[0]

  return {
    microcycleId: microcycle?.id ?? null,
    planId: plan?.id ?? null,
    workoutId: workout?.id ?? null,
  }
}

const isValidSelection = (
  plans: TPlanAccordionItem[],
  selection: Selection,
) => {
  const plan = plans.find((item) => item.id === selection.planId)
  if (!plan) return false

  const microcycle = plan.microcycles.find((item) => item.id === selection.microcycleId)
  if (!microcycle) return false

  return microcycle.workouts.some((item) => item.id === selection.workoutId)
}

export function WorkoutPlansAccordion({ plans }: { plans: TPlanAccordionItem[] }) {
  const initialSelection = useMemo(() => firstAvailableSelection(plans), [plans])
  const [selection, setSelection] = useState<Selection | null>(null)
  const storedSelectionRaw = useSyncExternalStore(
    subscribeToSelection,
    () => window.localStorage.getItem(STORAGE_KEY),
    () => SSR_SNAPSHOT,
  )
  const storedSelection = useMemo(() => {
    if (storedSelectionRaw === SSR_SNAPSHOT || !storedSelectionRaw) return initialSelection

    try {
      return JSON.parse(storedSelectionRaw) as Selection
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      return initialSelection
    }
  }, [initialSelection, storedSelectionRaw])

  const preferredSelection = selection ?? storedSelection
  const resolvedSelection = isValidSelection(plans, preferredSelection) ? preferredSelection : initialSelection

  useEffect(() => {
    if (storedSelectionRaw === SSR_SNAPSHOT) return
    if (!isValidSelection(plans, resolvedSelection)) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedSelection))
  }, [plans, resolvedSelection, storedSelectionRaw])

  const selectPlan = (plan: TPlanAccordionItem) => {
    const nextMicrocycle = plan.microcycles[0] ?? null
    const nextWorkout = nextMicrocycle?.workouts[0] ?? null
    setSelection({
      planId: plan.id,
      microcycleId: nextMicrocycle?.id ?? null,
      workoutId: nextWorkout?.id ?? null,
    })
  }

  const selectMicrocycle = (plan: TPlanAccordionItem, microcycleId: number | string) => {
    const microcycle = plan.microcycles.find((item) => item.id === microcycleId) ?? null
    const nextWorkout = microcycle?.workouts[0] ?? null
    setSelection({
      planId: plan.id,
      microcycleId,
      workoutId: nextWorkout?.id ?? null,
    })
  }

  const activePlan = plans.find((plan) => plan.id === resolvedSelection.planId) ?? null
  const activeMicrocycle =
    activePlan?.microcycles.find((microcycle) => microcycle.id === resolvedSelection.microcycleId) ?? null
  const activeWorkout =
    activeMicrocycle?.workouts.find((workout) => workout.id === resolvedSelection.workoutId) ?? null

  return (
    <div className="space-y-2.5">
      <Surface className="overflow-hidden py-1">
        {plans.map((plan) => {
          const isActivePlan = plan.id === resolvedSelection.planId

          return (
            <div className="border-t border-app-border first:border-t-0" key={plan.id}>
              <button
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors hover:bg-app-panel/60"
                onClick={() => selectPlan(plan)}
                type="button"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-app-text">{plan.title}</span>
                    <StatusBadge status={plan.status}>{plan.statusLabel}</StatusBadge>
                  </div>
                  {plan.dateRange && <div className="mt-0.5 text-xs text-app-muted">{plan.dateRange}</div>}
                </div>
                <span className={`shrink-0 text-xs ${mutedTextClass}`}>{isActivePlan ? '−' : '+'}</span>
              </button>

              {isActivePlan && (
                <div className="border-t border-app-border bg-app-panel/40 px-4 py-2">
                  {plan.description && <div className="mb-1.5 text-sm text-app-muted">{plan.description}</div>}

                  <div className="space-y-1.5">
                    {plan.microcycles.map((microcycle) => {
                      const isActiveMicrocycle = microcycle.id === resolvedSelection.microcycleId

                      return (
                        <div key={microcycle.id}>
                          <button
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-app-border bg-app-panel px-3 py-1.5 text-left transition-colors hover:border-app-muted"
                            onClick={() => selectMicrocycle(plan, microcycle.id)}
                            type="button"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="text-sm font-medium text-app-text">{microcycle.title}</div>
                              {microcycle.rpe != null && (
                                <span className="text-xs text-app-muted">RPE {microcycle.rpe}</span>
                              )}
                            </div>
                            <span className={`shrink-0 text-xs ${mutedTextClass}`}>
                              {microcycle.workouts.length} trening{microcycle.workouts.length === 1 ? '' : microcycle.workouts.length < 5 ? 'i' : 'ów'}
                            </span>
                          </button>

                          {isActiveMicrocycle && microcycle.workouts.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 pl-0.5">
                              {microcycle.workouts.map((workout) => {
                                const isActiveWorkout = workout.id === resolvedSelection.workoutId

                                return (
                                  <Button
                                    className={[
                                      'min-h-7 px-2.5 py-1 text-xs',
                                      isActiveWorkout ? 'border-app-accent bg-app-accent/10 text-app-text' : '',
                                    ].join(' ')}
                                    key={workout.id}
                                    onClick={() =>
                                      setSelection({
                                        ...resolvedSelection,
                                        workoutId: workout.id,
                                      })
                                    }
                                    variant="secondary"
                                  >
                                    {workout.title}
                                  </Button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </Surface>

      {activePlan && activeMicrocycle && activeWorkout && (
        <div className="space-y-2.5">
          <div className="rounded-lg border border-app-border bg-app-panel/60 px-4 py-2">
            <div className={sectionLabelClass}>Aktywny kontekst</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-app-text">
              <span>{activePlan.title}</span>
              <span className={mutedTextClass}>/</span>
              <span>{activeMicrocycle.title}</span>
              <span className={mutedTextClass}>/</span>
              <span className="font-semibold">{activeWorkout.title}</span>
            </div>
          </div>

          <WorkoutTracker key={activeWorkout.id} workout={activeWorkout} />
        </div>
      )}
    </div>
  )
}
