'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { LogoutButton } from '@/components/common/logout-button'
import { DailyDataProvider, atNoon, useDailyData } from '@/modules/training/components/daily'
import { DailyRings, type TaskId } from '@/modules/training/components/daily-rings'
import { DayTimeline } from '@/modules/training/components/diary/day-timeline'
import { QuickActions, type QuickAction } from '@/modules/training/components/quick-actions'
import { WorkoutTracker } from '@/modules/training/components/workout-tracker'
import type { PlanTree, WorkoutTree } from '@/modules/training/plans'
import { MicrocyclePicker, WorkoutPicker } from '@/modules/training/components/workout-plans/components/workout-pickers'
import { useWorkoutSelection } from '@/modules/training/components/workout-plans/hooks/use-workout-selection'

/**
 * Sum of explicitly prescribed sets across the workout. Returns null when any
 * row has no numeric set target — the UI then says "no target" instead of
 * guessing.
 */
const countPrescribedSets = (workout: WorkoutTree): number | null => {
  let total = 0
  for (const section of workout.sections) {
    for (const block of section.blocks) {
      for (const group of block.groups) {
        for (const exercise of group.exercises) {
          const match = (exercise.rounds ?? '').match(/\d+/)
          if (!match) return null
          total += Number(match[0])
        }
      }
    }
  }
  return total
}

const countExercises = (workout: WorkoutTree): number =>
  workout.sections.reduce(
    (total, section) =>
      total + section.blocks.reduce((b, block) => b + block.groups.reduce((g, group) => g + group.exercises.length, 0), 0),
    0,
  )

type Props = {
  clientId: number | string
  displayName: string
  plans: PlanTree[]
  dailyKcalTarget: number | null
  /** Reports, body, recent, progress — rendered below the daily content. */
  dashboard?: React.ReactNode
}

/** One scrolling home screen: date, rings, today's workout, quick entry, the day's timeline, then reports. */
export function HomeShell(props: Props) {
  return (
    <DailyDataProvider>
      <HomeContent {...props} />
    </DailyDataProvider>
  )
}

function HomeContent({ clientId, displayName, plans, dailyKcalTarget, dashboard }: Props) {
  const t = useTranslations('home')
  const format = useFormatter()
  const { date, isToday, shiftDay, setDate, refresh } = useDailyData()
  const viewKey = `training-app:${clientId}:today-view`

  const { resolvedSelection, activePlan, activeMicrocycle, activeWorkout, selectPlan, selectMicrocycle, selectWorkout } =
    useWorkoutSelection(plans, { storageScope: String(clientId) })

  const [inWorkout, setInWorkout] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(viewKey) === 'workout'
    } catch {
      return false
    }
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(viewKey, inWorkout ? 'workout' : 'home')
    } catch {
      /* private mode */
    }
  }, [inWorkout, viewKey])

  const leaveWorkout = () => {
    setInWorkout(false)
    refresh()
  }

  if (inWorkout && activeWorkout) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" className="min-h-11 gap-1.5 pl-0 text-sm font-semibold" onClick={leaveWorkout}>
          <ArrowLeft size={18} />
          {t('backToToday')}
        </Button>
        <WorkoutTracker key={activeWorkout.id} workout={activeWorkout} />
      </div>
    )
  }

  const prescribedSets = activeWorkout ? countPrescribedSets(activeWorkout) : null
  const exerciseCount = activeWorkout ? countExercises(activeWorkout) : 0

  const onTask = (task: TaskId) => {
    if (task === 'workout') {
      if (activeWorkout && isToday) setInWorkout(true)
      return
    }
    setQuickAction(task === 'meal' ? 'meal' : 'weight')
  }

  return (
    <div className="space-y-3">
      {/* Header: identity + date navigation */}
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-ui-fg-muted">{t('greetingCompact', { name: displayName })}</div>
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftDay(-1)}
              aria-label={t('prevDay')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ui-fg-muted transition-colors hover:bg-ui-bg-subtle hover:text-ui-fg-base"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setDate(new Date())}
              className="min-w-0 truncate text-lg font-bold tracking-tight text-ui-fg-base"
              aria-label={t('jumpToToday')}
            >
              {isToday ? t('today') : format.dateTime(atNoon(date), { weekday: 'short', day: 'numeric', month: 'short' })}
            </button>
            <button
              type="button"
              onClick={() => shiftDay(1)}
              aria-label={t('nextDay')}
              disabled={isToday}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ui-fg-muted transition-colors hover:bg-ui-bg-subtle hover:text-ui-fg-base disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <LogoutButton />
      </header>

      <DailyRings
        kcalTarget={dailyKcalTarget}
        workout={{ hasProgram: Boolean(activeWorkout) && isToday, prescribedSets }}
        onTask={onTask}
      />

      {/* Today's workout */}
      {isToday && activeWorkout && activePlan && activeMicrocycle ? (
        <section className="fx-card p-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-ui-fg-muted">
            <span>{t('todaysWorkout')}</span>
            <StatusBadge status={activePlan.status}>{activePlan.statusLabel}</StatusBadge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold tracking-tight text-ui-fg-base">{activeWorkout.title}</h2>
              <p className="mt-0.5 text-sm text-ui-fg-muted">
                {activePlan.title} · {activeMicrocycle.title} · {t('exerciseCount', { count: exerciseCount })}
                {prescribedSets !== null && ` · ${t('setCount', { count: prescribedSets })}`}
              </p>
            </div>
            <WorkoutStateMark />
          </div>
          <WorkoutCta onStart={() => setInWorkout(true)} />
        </section>
      ) : isToday ? (
        <section className="fx-card p-4 text-sm text-ui-fg-muted">{t('noProgram')}</section>
      ) : null}

      {isToday && plans.length > 0 && (
        <div className="fx-card">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between px-4 text-sm font-medium text-ui-fg-muted"
            onClick={() => setPickerOpen((open) => !open)}
            aria-expanded={pickerOpen}
          >
            {t('changeWorkout')}
            <ChevronDown size={16} className={pickerOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
          {pickerOpen && activePlan && activeMicrocycle && (
            <div className="space-y-2 border-t border-ui-border-base px-4 py-3">
              {plans.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => selectPlan(plan)}
                      className={`min-h-9 rounded-lg border px-2.5 text-xs font-semibold ${
                        plan.id === resolvedSelection.planId ? 'border-ui-border-interactive text-ui-fg-interactive' : 'border-ui-border-base text-ui-fg-muted'
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
                <WorkoutPicker workouts={activeMicrocycle.workouts} activeWorkoutId={resolvedSelection.workoutId} onSelect={selectWorkout} />
              )}
            </div>
          )}
        </div>
      )}

      <QuickActions open={quickAction} onOpenChange={setQuickAction} />

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold text-ui-fg-muted">{isToday ? t('todayLog') : t('dayLog')}</h2>
        <DayTimeline />
      </section>

      {dashboard}
    </div>
  )
}

/** Green check when the selected day's workout is already completed. */
function WorkoutStateMark() {
  const { data } = useDailyData()
  if (!data || data.completedSessions.length === 0) return null
  return <Check size={22} strokeWidth={2.5} className="shrink-0" style={{ color: 'var(--color-stat-green)' }} aria-hidden />
}

function WorkoutCta({ onStart }: { onStart: () => void }) {
  const t = useTranslations('home')
  const { data, loading } = useDailyData()
  const completed = (data?.completedSessions.length ?? 0) > 0
  const inProgress = Boolean(data?.openSession)
  return (
    <Button className="mt-3 min-h-11 w-full gap-2 text-base font-semibold" onClick={onStart} disabled={loading}>
      <Play size={16} />
      {inProgress ? t('continueWorkout') : completed ? t('reviewWorkout') : t('startWorkout')}
    </Button>
  )
}
