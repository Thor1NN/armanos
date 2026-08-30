'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Play } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { statLabelClass } from '@/lib/class-names'
import { Button } from '@/components/ui/button'
import { StatRing } from '@/components/ui/stat-ring'
import { StatusBadge } from '@/components/ui/status-badge'
import { WorkoutTracker } from '@/modules/training/components/workout-tracker'
import type { PlanTree, WorkoutTree } from '@/modules/training/plans'
import { MicrocyclePicker, WorkoutPicker } from '@/modules/training/components/workout-plans/components/workout-pickers'
import { useWorkoutSelection } from '@/modules/training/components/workout-plans/hooks/use-workout-selection'

const VIEW_STORAGE_KEY = 'training-app:today-view'

type SessionState = 'fresh' | 'inProgress' | 'completed'

/** Sum of prescribed sets across the workout (first number of each row's `rounds`). */
const countPrescribedSets = (workout: WorkoutTree): number =>
  workout.sections.reduce(
    (total, section) =>
      total +
      section.blocks.reduce(
        (blockTotal, block) =>
          blockTotal +
          block.groups.reduce(
            (groupTotal, group) =>
              groupTotal +
              group.exercises.reduce((rowTotal, exercise) => {
                const match = (exercise.rounds ?? '').match(/\d+/)
                return rowTotal + (match ? Number(match[0]) : 3)
              }, 0),
            0,
          ),
        0,
      ),
    0,
  )

const countExercises = (workout: WorkoutTree): number =>
  workout.sections.reduce(
    (total, section) =>
      total +
      section.blocks.reduce(
        (blockTotal, block) =>
          blockTotal + block.groups.reduce((groupTotal, group) => groupTotal + group.exercises.length, 0),
        0,
      ),
    0,
  )

/**
 * App-style client home: one "today's workout" hero card with a Start /
 * Continue button; the plan machinery hides behind "Change workout". Starting
 * opens the focused workout screen (the existing tracker).
 */
export function TodayHome({ plans }: { plans: PlanTree[] }) {
  const t = useTranslations('today')
  const {
    resolvedSelection,
    activePlan,
    activeMicrocycle,
    activeWorkout,
    selectPlan,
    selectMicrocycle,
    selectWorkout,
  } = useWorkoutSelection(plans, {})

  const [inWorkout, setInWorkout] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'workout'
    } catch {
      return false
    }
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [checked, setChecked] = useState<{
    workoutId: number
    state: SessionState
    setsLogged: number
  } | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, inWorkout ? 'workout' : 'home')
    } catch {
      /* private mode */
    }
  }, [inWorkout])

  // What state is today's workout in? Drives the hero button label.
  useEffect(() => {
    if (!activeWorkout) return
    const workoutId = activeWorkout.id
    let active = true
    sdk
      .find({
        collection: 'workout-logs',
        where: { workout: { equals: activeWorkout.id } },
        sort: '-updatedAt',
        limit: 1,
        depth: 0,
      })
      .then(async (result) => {
        const doc = result.docs[0]
        const state: SessionState = !doc ? 'fresh' : !doc.completedAt ? 'inProgress' : 'completed'
        let setsLogged = 0
        if (doc && state === 'inProgress') {
          const sets = await sdk.find({
            collection: 'set-logs',
            where: { session: { equals: doc.id } },
            limit: 1,
            depth: 0,
          })
          setsLogged = sets.totalDocs
        }
        if (!active) return
        setChecked({ workoutId, state, setsLogged })
      })
      .catch(() => {
        if (active) setChecked({ workoutId, state: 'fresh', setsLogged: 0 })
      })
    return () => {
      active = false
    }
  }, [activeWorkout, inWorkout])

  if (!activeWorkout || !activePlan || !activeMicrocycle) {
    return <div className="py-10 text-center text-sm text-ui-fg-muted">{t('noWorkout')}</div>
  }

  if (inWorkout) {
    return (
      <div className="space-y-2.5">
        <Button variant="ghost" className="gap-1.5 pl-0 text-sm" onClick={() => setInWorkout(false)}>
          <ArrowLeft size={16} />
          {t('backToToday')}
        </Button>
        <WorkoutTracker key={activeWorkout.id} workout={activeWorkout} />
      </div>
    )
  }

  const exerciseCount = countExercises(activeWorkout)
  const prescribedSets = countPrescribedSets(activeWorkout)
  const sessionState: SessionState | 'loading' =
    checked && checked.workoutId === activeWorkout.id ? checked.state : 'loading'
  const setsLogged = checked && checked.workoutId === activeWorkout.id ? checked.setsLogged : 0
  const ringValue =
    sessionState === 'completed'
      ? 100
      : sessionState === 'inProgress' && prescribedSets > 0
        ? Math.min(100, Math.round((setsLogged / prescribedSets) * 100))
        : 0
  const ringColor = sessionState === 'completed' ? 'green' : 'blue'

  return (
    <div className="space-y-3">
      {/* Hero: today's workout */}
      <div className="rounded-2xl border border-ui-border-base bg-ui-bg-component p-5">
        <div className={`mb-3 flex items-center justify-between gap-2 ${statLabelClass}`}>
          <span>{t('heroLabel')}</span>
          <StatusBadge status={activePlan.status}>{activePlan.statusLabel}</StatusBadge>
        </div>

        <div className="flex items-center gap-5">
          <StatRing value={ringValue} color={ringColor} size={116} strokeWidth={9}>
            {sessionState === 'completed' ? (
              <Check size={34} strokeWidth={2.5} style={{ color: 'var(--color-stat-green)' }} />
            ) : (
              <>
                <span className="text-2xl font-bold tabular-nums leading-none text-ui-fg-base">
                  {sessionState === 'inProgress' ? `${ringValue}%` : exerciseCount}
                </span>
                <span className={`mt-1 ${statLabelClass}`}>
                  {sessionState === 'inProgress' ? t('ringSets') : t('ringExercises')}
                </span>
              </>
            )}
          </StatRing>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ui-fg-muted">
              {activePlan.title} · {activeMicrocycle.title}
            </div>
            <h2 className="mt-0.5 text-2xl font-bold leading-tight text-ui-fg-base">
              {activeWorkout.title}
            </h2>
            <p className="mt-1 text-sm text-ui-fg-muted">
              {t('exerciseCount', { count: exerciseCount })}
              {prescribedSets > 0 && ` · ${t('setCount', { count: prescribedSets })}`}
              {activeWorkout.rpe != null && ` · RPE ${activeWorkout.rpe}`}
            </p>
          </div>
        </div>

        {sessionState === 'completed' ? (
          <div
            className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
            style={{ background: 'color-mix(in srgb, var(--color-stat-green) 10%, transparent)', color: 'var(--color-stat-green)' }}
          >
            <Check size={16} className="shrink-0" />
            {t('completedHint')}
          </div>
        ) : null}

        <Button
          className="mt-4 w-full gap-2 py-3 text-base font-semibold"
          onClick={() => setInWorkout(true)}
          disabled={sessionState === 'loading'}
        >
          <Play size={16} />
          {sessionState === 'inProgress'
            ? t('continueWorkout')
            : sessionState === 'completed'
              ? t('reviewWorkout')
              : t('startWorkout')}
        </Button>
      </div>

      {/* Plan machinery, hidden until needed */}
      <div className="rounded-2xl border border-ui-border-base bg-ui-bg-component">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ui-fg-muted"
          onClick={() => setPickerOpen((open) => !open)}
        >
          {t('changeWorkout')}
          <ChevronDown size={16} className={pickerOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        {pickerOpen && (
          <div className="space-y-2 border-t border-ui-border-base px-4 py-3">
            {plans.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => selectPlan(plan)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                      plan.id === resolvedSelection.planId
                        ? 'border-ui-fg-interactive text-ui-fg-interactive'
                        : 'border-ui-border-base text-ui-fg-muted'
                    }`}
                  >
                    {plan.title}
                  </button>
                ))}
              </div>
            )}
            <MicrocyclePicker
              microcycles={activePlan.microcycles}
              activeMicrocycleId={resolvedSelection.microcycleId}
              onSelect={(microcycleId) => selectMicrocycle(activePlan, microcycleId)}
            />
            {activeMicrocycle.workouts.length > 0 && (
              <WorkoutPicker
                workouts={activeMicrocycle.workouts}
                activeWorkoutId={resolvedSelection.workoutId}
                onSelect={selectWorkout}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
