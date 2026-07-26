'use client'

import React from 'react'
import { WorkoutTracker } from '@/modules/training/components/workout-tracker'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { mutedTextClass } from '@/lib/class-names'
import type { PlanTree } from '@/modules/training/plans'
import { ActiveContextBanner } from './components/active-context-banner'
import { MicrocyclePicker, WorkoutPicker } from './components/workout-pickers'
import { useWorkoutSelection } from './hooks/use-workout-selection'

export function WorkoutPlans({
  plans,
  readOnly,
  showResults,
}: {
  plans: PlanTree[]
  readOnly?: boolean
  showResults?: boolean
}) {
  const {
    resolvedSelection,
    activePlan,
    activeMicrocycle,
    activeWorkout,
    selectPlan,
    selectMicrocycle,
    selectWorkout,
  } = useWorkoutSelection(plans, { readOnly })

  return (
    <div className="space-y-2.5">
      <Surface className="overflow-hidden py-1">
        {plans.map((plan) => {
          const isActivePlan = plan.id === resolvedSelection.planId

          return (
            <div className="border-t border-ui-border-base first:border-t-0" key={plan.id}>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between gap-3 pl-0 pr-4 py-2 hover:bg-ui-bg-subtle/60"
                onClick={() => selectPlan(plan)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ui-fg-base">{plan.title}</span>
                    <StatusBadge status={plan.status}>{plan.statusLabel}</StatusBadge>
                  </div>
                  {plan.dateRange && <div className="mt-0.5 text-xs text-ui-fg-muted">{plan.dateRange}</div>}
                </div>
                <span className={`shrink-0 text-xs ${mutedTextClass}`}>{isActivePlan ? '−' : '+'}</span>
              </Button>

              {isActivePlan && (
                <div className="border-t border-ui-border-base bg-ui-bg-subtle/40 py-2 space-y-1.5">
                  {plan.description && (
                    <div className="text-sm text-ui-fg-muted">{plan.description}</div>
                  )}

                  <MicrocyclePicker
                    microcycles={plan.microcycles}
                    activeMicrocycleId={resolvedSelection.microcycleId}
                    onSelect={(microcycleId) => selectMicrocycle(plan, microcycleId)}
                  />

                  {activeMicrocycle && activeMicrocycle.workouts.length > 0 && (
                    <WorkoutPicker
                      workouts={activeMicrocycle.workouts}
                      activeWorkoutId={resolvedSelection.workoutId}
                      onSelect={selectWorkout}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Surface>

      {activePlan && activeMicrocycle && activeWorkout && (
        <div className="space-y-2.5">
          {!readOnly && (
            <ActiveContextBanner
              planTitle={activePlan.title}
              microcycleTitle={activeMicrocycle.title}
              workoutTitle={activeWorkout.title}
            />
          )}

          <WorkoutTracker key={activeWorkout.id} workout={activeWorkout} readOnly={readOnly} showResults={showResults} />
        </div>
      )}
    </div>
  )
}
