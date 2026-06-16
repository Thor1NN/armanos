'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { WorkoutTracker } from '@/components/workout/workout-tracker'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { mutedTextClass, sectionLabelClass } from '@/lib/class-names'
import type { TPlanAccordionItem } from '@/types/plan'
import { useWorkoutSelection } from './hooks/use-workout-selection'

export function WorkoutPlansAccordion({
  plans,
  readOnly,
  showResults,
}: {
  plans: TPlanAccordionItem[]
  readOnly?: boolean
  showResults?: boolean
}) {
  const t = useTranslations('workout')
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

                  <div className="flex gap-1.5">
                    {plan.microcycles.map((microcycle, index) => {
                      const isActiveMicrocycle = microcycle.id === resolvedSelection.microcycleId
                      return (
                        <Button
                          key={microcycle.id}
                          size="sm"
                          variant={isActiveMicrocycle ? 'primary' : 'secondary'}
                          className="flex-1"
                          onClick={() => selectMicrocycle(plan, microcycle.id)}
                        >
                          M{index + 1}({microcycle.workouts.length})
                        </Button>
                      )
                    })}
                  </div>

                  {activeMicrocycle && activeMicrocycle.workouts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activeMicrocycle.workouts.map((workout) => (
                        <Button
                          key={workout.id}
                          size="sm"
                          variant="secondary"
                          active={workout.id === resolvedSelection.workoutId}
                          onClick={() => selectWorkout(workout.id)}
                        >
                          {workout.title}
                        </Button>
                      ))}
                    </div>
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
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle/60 px-4 py-2">
              <div className={sectionLabelClass}>{t('activeContext')}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ui-fg-base">
                <span>{activePlan.title}</span>
                <span className={mutedTextClass}>/</span>
                <span>{activeMicrocycle.title}</span>
                <span className={mutedTextClass}>/</span>
                <span className="font-semibold">{activeWorkout.title}</span>
              </div>
            </div>
          )}

          <WorkoutTracker key={activeWorkout.id} workout={activeWorkout} readOnly={readOnly} showResults={showResults} />
        </div>
      )}
    </div>
  )
}
