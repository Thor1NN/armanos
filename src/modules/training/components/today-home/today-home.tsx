'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Play } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { statLabelClass } from '@/lib/class-names'
import { Button } from '@/components/ui/button'
import { CountUp, StatRing } from '@/components/ui/stat-ring'
import { StatusBadge } from '@/components/ui/status-badge'
import { WorkoutTracker } from '@/modules/training/components/workout-tracker'
import type { PlanTree, WorkoutTree } from '@/modules/training/plans'
import { MicrocyclePicker, WorkoutPicker } from '@/modules/training/components/workout-plans/components/workout-pickers'
import { useWorkoutSelection } from '@/modules/training/components/workout-plans/hooks/use-workout-selection'

const VIEW_STORAGE_KEY = 'training-app:today-view'
const DEFAULT_KCAL_TARGET = 2000

type SessionState = 'fresh' | 'inProgress' | 'completed'

type TodayStats = {
  workoutId: number
  state: SessionState
  setsLogged: number
  completedToday: boolean
  kcalToday: number
  hasMealToday: boolean
  hasActivityToday: boolean
}

const dayBounds = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

const isTodayIso = (iso: string | null | undefined): boolean => {
  if (!iso) return false
  const date = new Date(iso)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

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
 * Single-screen dashboard home. Top: three WHOOP-style rings — calories
 * (green, vs daily target), effort (blue, sets done vs prescribed), tasks
 * (daily checklist: train / log a meal / log activity). Below: compact
 * workout card, plan picker, then the dashboard sections.
 */
export function TodayHome({
  plans,
  dailyKcalTarget,
  dashboard,
}: {
  plans: PlanTree[]
  dailyKcalTarget?: number | null
  /** Dashboard cards rendered below the hero when not inside a workout. */
  dashboard?: React.ReactNode
}) {
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
  const [stats, setStats] = useState<TodayStats | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, inWorkout ? 'workout' : 'home')
    } catch {
      /* private mode */
    }
  }, [inWorkout])

  // One combined stats fetch: session state + today's diary.
  useEffect(() => {
    if (!activeWorkout) return
    const workoutId = activeWorkout.id
    let active = true
    const { start, end } = dayBounds()

    Promise.all([
      sdk.find({
        collection: 'workout-logs',
        where: { workout: { equals: workoutId } },
        sort: '-updatedAt',
        limit: 1,
        depth: 0,
      }),
      sdk.find({
        collection: 'diary-entries',
        where: {
          and: [
            { entryDate: { greater_than_equal: start } },
            { entryDate: { less_than: end } },
          ],
        },
        limit: 100,
        depth: 0,
      }),
    ])
      .then(async ([logs, diary]) => {
        const doc = logs.docs[0]
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
        setStats({
          workoutId,
          state,
          setsLogged,
          completedToday: state === 'completed' && isTodayIso(doc?.completedAt),
          kcalToday: diary.docs.reduce((sum, entry) => sum + (entry.totalKcal ?? 0), 0),
          hasMealToday: diary.docs.some((entry) => entry.kind === 'meal'),
          hasActivityToday: diary.docs.some((entry) => entry.kind !== 'meal'),
        })
      })
      .catch(() => {
        if (active) {
          setStats({
            workoutId,
            state: 'fresh',
            setsLogged: 0,
            completedToday: false,
            kcalToday: 0,
            hasMealToday: false,
            hasActivityToday: false,
          })
        }
      })
    return () => {
      active = false
    }
  }, [activeWorkout, inWorkout])

  if (!activeWorkout || !activePlan || !activeMicrocycle) {
    return (
      <div className="space-y-3">
        <div className="py-10 text-center text-sm text-ui-fg-muted">{t('noWorkout')}</div>
        {dashboard}
      </div>
    )
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
  const current = stats && stats.workoutId === activeWorkout.id ? stats : null
  const sessionState: SessionState | 'loading' = current ? current.state : 'loading'

  // Ring 1 — calories vs daily target (green)
  const kcalToday = current?.kcalToday ?? 0
  const kcalTarget = dailyKcalTarget || DEFAULT_KCAL_TARGET
  const kcalValue = Math.min(100, Math.round((kcalToday / kcalTarget) * 100))

  // Ring 2 — effort: sets done vs prescribed (blue)
  const effortValue =
    sessionState === 'completed'
      ? 100
      : sessionState === 'inProgress' && prescribedSets > 0
        ? Math.min(100, Math.round(((current?.setsLogged ?? 0) / prescribedSets) * 100))
        : 0

  // Ring 3 — daily tasks: train, log a meal, log activity (amber → green)
  const tasksDone =
    (current?.completedToday ? 1 : 0) +
    (current?.hasMealToday ? 1 : 0) +
    (current?.hasActivityToday ? 1 : 0)
  const tasksValue = Math.round((tasksDone / 3) * 100)

  return (
    <div className="space-y-3">
      {/* Top stat rings — the WHOOP row */}
      <div className="fx-card fx-in px-2 py-4">
        <div className="flex items-start justify-around">
          <div className="flex flex-col items-center gap-2">
            <StatRing value={kcalValue} color="green" size={96} strokeWidth={7}>
              <span className="text-xl font-bold tabular-nums leading-none text-ui-fg-base">
                <CountUp value={kcalToday} />
              </span>
              <span className={`mt-0.5 ${statLabelClass}`}>/ {kcalTarget}</span>
            </StatRing>
            <span className={statLabelClass}>{t('ringCalories')}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <StatRing value={effortValue} color="blue" size={96} strokeWidth={7}>
              <span className="text-xl font-bold tabular-nums leading-none text-ui-fg-base">
                <CountUp value={effortValue} />%
              </span>
              <span className={`mt-0.5 ${statLabelClass}`}>
                {sessionState === 'inProgress'
                  ? `${current?.setsLogged ?? 0}/${prescribedSets}`
                  : t('ringSets')}
              </span>
            </StatRing>
            <span className={statLabelClass}>{t('ringEffort')}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <StatRing value={tasksValue} color={tasksDone === 3 ? 'green' : 'amber'} size={96} strokeWidth={7}>
              <span className="text-xl font-bold tabular-nums leading-none text-ui-fg-base">
                {tasksDone}/3
              </span>
              <span className={`mt-0.5 ${statLabelClass}`}>{t('ringDone')}</span>
            </StatRing>
            <span className={statLabelClass}>{t('ringTasks')}</span>
          </div>
        </div>
      </div>

      {/* Compact workout card */}
      <div className="fx-card fx-in p-4" style={{ animationDelay: '80ms' }}>
        <div className={`mb-2 flex items-center justify-between gap-2 ${statLabelClass}`}>
          <span>{t('heroLabel')}</span>
          <StatusBadge status={activePlan.status}>{activePlan.statusLabel}</StatusBadge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight text-ui-fg-base">{activeWorkout.title}</h2>
            <p className="mt-0.5 text-xs text-ui-fg-muted">
              {activePlan.title} · {activeMicrocycle.title} · {t('exerciseCount', { count: exerciseCount })}
              {prescribedSets > 0 && ` · ${t('setCount', { count: prescribedSets })}`}
            </p>
          </div>
          {sessionState === 'completed' && (
            <Check
              size={22}
              strokeWidth={2.5}
              className="shrink-0"
              style={{ color: 'var(--color-stat-green)' }}
            />
          )}
        </div>
        <Button
          className="fx-btn-glow mt-3 w-full gap-2 py-2.5 text-sm font-semibold"
          onClick={() => setInWorkout(true)}
          disabled={sessionState === 'loading'}
        >
          <Play size={15} />
          {sessionState === 'inProgress'
            ? t('continueWorkout')
            : sessionState === 'completed'
              ? t('reviewWorkout')
              : t('startWorkout')}
        </Button>
      </div>

      {/* Plan machinery, hidden until needed */}
      <div className="fx-card fx-in" style={{ animationDelay: '140ms' }}>
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

      {dashboard}
    </div>
  )
}
