'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { Check, Circle, CheckCircle2 } from 'lucide-react'
import { StatRing } from '@/components/ui/stat-ring'
import { useDailyData } from '@/modules/training/components/daily'

export type WorkoutContext = {
  /** Whether a program workout exists for the selected day (today only). */
  hasProgram: boolean
  /** Sum of explicitly prescribed sets, or null when any row lacks a number. */
  prescribedSets: number | null
}

export type TaskId = 'workout' | 'meal' | 'body'

const RING_WRAPPER = 'w-[clamp(78px,24vw,104px)]'

/**
 * The three daily rings. Every number is a recorded fact:
 * - Calories: kcal logged for the selected day, against the coach's target
 *   if one is set (never a made-up default).
 * - Workout: working sets recorded against the day's prescribed sets; shows
 *   completion, not physiological effort.
 * - Tasks: the visible checklist below (train, log a meal, log weight or activity).
 */
export function DailyRings({
  kcalTarget,
  workout,
  onTask,
}: {
  kcalTarget: number | null
  workout: WorkoutContext
  onTask?: (task: TaskId) => void
}) {
  const t = useTranslations('rings')
  const { data, loading, isToday } = useDailyData()

  const entries = data?.entries ?? []
  const meals = entries.filter((entry) => entry.kind === 'meal')
  const kcal = meals.reduce((sum, entry) => sum + (entry.totalKcal ?? 0), 0)
  const hasMeal = meals.length > 0
  const hasActivity = entries.some((entry) => entry.kind === 'activity')
  const hasWeight = (data?.measurements ?? []).some((measurement) => measurement.weightKg != null)
  const completedSessions = data?.completedSessions.length ?? 0
  const completedSets = data?.completedSets ?? 0
  const openSets = data?.openSessionSets ?? 0
  const inProgress = Boolean(data?.openSession)

  // Ring 1 — calories
  const kcalValue = kcalTarget && kcalTarget > 0 ? Math.min(100, Math.round((kcal / kcalTarget) * 100)) : 0
  const kcalSub = !hasMeal
    ? t('noMeals')
    : kcalTarget && kcalTarget > 0
      ? t('ofTarget', { target: kcalTarget })
      : t('noTarget')

  // Ring 2 — workout completion
  const workoutDone = completedSessions > 0
  const workoutSetsShown = workoutDone ? completedSets : openSets
  let workoutValue = 0
  let workoutSub: string
  let workoutCenter: React.ReactNode
  if (workoutDone) {
    workoutValue = 100
    workoutCenter = <Check size={30} strokeWidth={2.5} style={{ color: 'var(--color-stat-green)' }} aria-hidden />
    workoutSub = t('setsDone', { count: workoutSetsShown })
  } else if (inProgress) {
    workoutValue =
      workout.prescribedSets && workout.prescribedSets > 0
        ? Math.min(100, Math.round((openSets / workout.prescribedSets) * 100))
        : 0
    workoutCenter = <span className="font-display text-2xl font-bold tabular-nums leading-none">{openSets}</span>
    workoutSub = workout.prescribedSets ? t('setsOf', { total: workout.prescribedSets }) : t('setsNoTarget')
  } else if (isToday && workout.hasProgram) {
    workoutCenter = <span className="font-display text-2xl font-bold tabular-nums leading-none">0</span>
    workoutSub = workout.prescribedSets ? t('setsOf', { total: workout.prescribedSets }) : t('notStarted')
  } else {
    workoutCenter = <span className="text-lg font-semibold text-ui-fg-muted">–</span>
    workoutSub = isToday ? t('restDay') : t('noWorkout')
  }

  // Ring 3 — tasks (only tasks that make sense for the day count)
  const tasks: { id: TaskId; label: string; done: boolean; applicable: boolean }[] = [
    { id: 'workout', label: t('taskWorkout'), done: workoutDone, applicable: workout.hasProgram || workoutDone },
    { id: 'meal', label: t('taskMeal'), done: hasMeal, applicable: true },
    { id: 'body', label: t('taskBody'), done: hasWeight || hasActivity, applicable: true },
  ]
  const applicable = tasks.filter((task) => task.applicable)
  const tasksDone = applicable.filter((task) => task.done).length
  const tasksValue = applicable.length ? Math.round((tasksDone / applicable.length) * 100) : 0

  const numeral = 'font-display text-2xl font-bold tabular-nums leading-none text-ui-fg-base'
  const sub = 'mt-1 max-w-[9ch] text-[11px] leading-tight text-ui-fg-muted'
  const label = 'mt-2 text-xs font-semibold text-ui-fg-base'

  return (
    <section aria-busy={loading} className="fx-card px-3 py-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center text-center">
          <div className={RING_WRAPPER}>
            <StatRing value={kcalValue} color="green" responsive strokeWidth={8} label={t('calories')}>
              <span className={numeral}>{hasMeal ? kcal : '–'}</span>
              <span className={sub}>{kcalSub}</span>
            </StatRing>
          </div>
          <span className={label}>{t('calories')}</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className={RING_WRAPPER}>
            <StatRing value={workoutValue} color="blue" responsive strokeWidth={8} label={t('workout')}>
              {workoutCenter}
              <span className={sub}>{workoutSub}</span>
            </StatRing>
          </div>
          <span className={label}>{t('workout')}</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className={RING_WRAPPER}>
            <StatRing
              value={tasksValue}
              color={applicable.length > 0 && tasksDone === applicable.length ? 'green' : 'amber'}
              responsive
              strokeWidth={8}
              label={t('tasks')}
            >
              <span className={numeral}>
                {tasksDone}
                <span className="text-base text-ui-fg-muted">/{applicable.length}</span>
              </span>
              <span className={sub}>{t('done')}</span>
            </StatRing>
          </div>
          <span className={label}>{t('tasks')}</span>
        </div>
      </div>

      {/* The checklist the Tasks ring counts */}
      <ul className="mt-4 flex list-none flex-col gap-1 p-0" aria-label={t('tasks')}>
        {applicable.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onTask?.(task.id)}
              className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2 text-left text-sm transition-colors hover:bg-ui-bg-subtle"
            >
              {task.done ? (
                <CheckCircle2 size={18} style={{ color: 'var(--color-stat-green)' }} aria-hidden />
              ) : (
                <Circle size={18} className="text-ui-border-strong" aria-hidden />
              )}
              <span className={task.done ? 'text-ui-fg-muted line-through' : 'text-ui-fg-base'}>{task.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
