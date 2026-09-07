'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Flame, Scale } from 'lucide-react'
import { sdk } from '@/lib/sdk'
import { joinClasses, statLabelClass } from '@/lib/class-names'
import { isWorkingSet, sessionVolume } from '@/modules/training/logs'
import { useDailyData } from '@/modules/training/components/daily'
import type { BodyMeasurement, DiaryEntry, SetLog, WorkoutLog } from '@/payload-types'

const PERIODS = ['day', 'week', 'month', 'ytd'] as const
type Period = (typeof PERIODS)[number]

type Range = { start: Date; end: Date }

type Report = {
  key: string
  workouts: number
  volume: number
  sets: number
  kcal: number
  /** Average over days that have at least one meal logged. */
  kcalPerLoggedDay: number | null
  loggedDays: number
  daysElapsed: number
  weightStart: number | null
  weightEnd: number | null
  sessions: WorkoutLog[]
  /** True when any query hit its page limit — totals may be incomplete. */
  truncated: boolean
}

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** Monday-based week start. */
const startOfWeek = (date: Date): Date => {
  const day = startOfDay(date)
  const weekday = (day.getDay() + 6) % 7
  day.setDate(day.getDate() - weekday)
  return day
}

const rangeFor = (period: Period, cursor: Date): Range => {
  if (period === 'day') {
    const start = startOfDay(cursor)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end }
  }
  if (period === 'week') {
    const start = startOfWeek(cursor)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end }
  }
  if (period === 'month') {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    return { start, end }
  }
  const start = new Date(cursor.getFullYear(), 0, 1)
  const end = new Date(cursor.getFullYear() + 1, 0, 1)
  return { start, end }
}

/** Moves the cursor by one period; month/year moves anchor to day 1 so end-of-month dates never overflow. */
const shift = (period: Period, cursor: Date, direction: 1 | -1): Date => {
  if (period === 'day') return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + direction)
  if (period === 'week') return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7 * direction)
  if (period === 'month') return new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1)
  return new Date(cursor.getFullYear() + direction, 0, 1)
}

const LIMITS = { sessions: 400, sets: 5000, diary: 1000, measurements: 400 } as const

/** Day / week / month / year-to-date training + nutrition report. */
export function ReportsCard() {
  const t = useTranslations('reports')
  const format = useFormatter()
  const [period, setPeriod] = useState<Period>('week')
  const [cursor, setCursor] = useState(() => new Date())
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState(false)
  const { version } = useDailyData()

  const range = rangeFor(period, cursor)
  const rangeKey = `${period}:${range.start.toISOString()}:${version}`
  const isCurrent = rangeFor(period, new Date()).start.getTime() === range.start.getTime()

  useEffect(() => {
    let active = true
    const startIso = range.start.toISOString()
    const endIso = range.end.toISOString()

    const load = async () => {
      const sessions = await sdk.find({
        collection: 'workout-logs',
        where: {
          and: [
            { completedAt: { greater_than_equal: startIso } },
            { completedAt: { less_than: endIso } },
          ],
        },
        sort: 'completedAt',
        limit: LIMITS.sessions,
        depth: 0,
      })
      const sessionIds = sessions.docs.map((doc) => doc.id)

      const [sets, diary, measurements] = await Promise.all([
        sessionIds.length
          ? sdk.find({
              collection: 'set-logs',
              where: { session: { in: sessionIds } },
              limit: LIMITS.sets,
              depth: 0,
            })
          : Promise.resolve({ docs: [] as SetLog[] }),
        sdk.find({
          collection: 'diary-entries',
          where: {
            and: [
              { entryDate: { greater_than_equal: startIso } },
              { entryDate: { less_than: endIso } },
            ],
          },
          limit: LIMITS.diary,
          depth: 0,
        }) as Promise<{ docs: DiaryEntry[] }>,
        sdk.find({
          collection: 'body-measurements',
          where: {
            and: [
              { measuredAt: { greater_than_equal: startIso } },
              { measuredAt: { less_than: endIso } },
              { weightKg: { exists: true } },
            ],
          },
          sort: 'measuredAt',
          limit: LIMITS.measurements,
          depth: 0,
        }) as Promise<{ docs: BodyMeasurement[] }>,
      ])
      if (!active) return

      const meals = diary.docs.filter((entry) => entry.kind === 'meal')
      const kcal = meals.reduce((sum, entry) => sum + (entry.totalKcal ?? 0), 0)
      const loggedDays = new Set(
        meals.map((entry) => {
          const d = new Date(entry.entryDate)
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        }),
      ).size
      const daysElapsed = Math.max(
        1,
        Math.ceil(
          (Math.min(Date.now(), range.end.getTime()) - range.start.getTime()) / 86400000,
        ),
      )
      setReport({
        key: rangeKey,
        workouts: sessions.docs.length,
        volume: sessionVolume(sets.docs),
        sets: sets.docs.filter(isWorkingSet).length,
        kcal,
        kcalPerLoggedDay: loggedDays > 0 ? Math.round(kcal / loggedDays) : null,
        loggedDays,
        daysElapsed,
        weightStart: measurements.docs[0]?.weightKg ?? null,
        weightEnd: measurements.docs[measurements.docs.length - 1]?.weightKg ?? null,
        sessions: sessions.docs,
        truncated:
          sessions.docs.length >= LIMITS.sessions ||
          sets.docs.length >= LIMITS.sets ||
          diary.docs.length >= LIMITS.diary ||
          measurements.docs.length >= LIMITS.measurements,
      })
      setError(false)
    }

    load().catch(() => {
      if (active) setError(true)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey])

  const loading = report?.key !== rangeKey

  // next-intl renders dates in UTC — anchor display dates to local noon so
  // midnight boundaries never shift a day.
  const atNoon = (date: Date): Date => {
    const copy = new Date(date)
    copy.setHours(12, 0, 0, 0)
    return copy
  }

  const rangeLabel =
    period === 'day'
      ? format.dateTime(atNoon(range.start), { weekday: 'short', day: 'numeric', month: 'long' })
      : period === 'week'
        ? `${format.dateTime(atNoon(range.start), { day: 'numeric', month: 'short' })} – ${format.dateTime(
            atNoon(new Date(range.end.getTime() - 86400000)),
            { day: 'numeric', month: 'short' },
          )}`
        : period === 'month'
          ? format.dateTime(atNoon(range.start), { month: 'long', year: 'numeric' })
          : `${range.start.getFullYear()} · ${t('ytdLabel')}`

  const weightDelta =
    report && report.weightStart != null && report.weightEnd != null && report.weightStart !== report.weightEnd
      ? Math.round((report.weightEnd - report.weightStart) * 10) / 10
      : null

  return (
    <section className="fx-card p-4">
      <h2 className="mb-3 text-xs font-semibold text-ui-fg-muted">{t('label')}</h2>

      {/* Period tabs */}
      <div className="mb-3 flex gap-1">
        {PERIODS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPeriod(option)
              setCursor(new Date())
            }}
            className={joinClasses('min-h-9 flex-1 rounded-lg border px-2 text-xs font-semibold transition-colors')}
            style={
              period === option
                ? {
                    borderColor: 'var(--color-stat-blue)',
                    color: 'var(--color-stat-blue)',
                    background: 'color-mix(in srgb, var(--color-stat-blue) 10%, transparent)',
                  }
                : { borderColor: 'var(--color-ui-border-base)', color: 'var(--color-ui-fg-muted)' }
            }
          >
            {t(`period_${option}`)}
          </button>
        ))}
      </div>

      {/* Range navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label={t('prev')}
          onClick={() => setCursor((current) => shift(period, current, -1))}
          className="rounded-full p-1.5 text-ui-fg-muted hover:text-ui-fg-base"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold">{isCurrent && period === 'day' ? t('today') : rangeLabel}</span>
        <button
          type="button"
          aria-label={t('next')}
          onClick={() => setCursor((current) => shift(period, current, 1))}
          disabled={isCurrent}
          className={joinClasses(
            'rounded-full p-1.5 text-ui-fg-muted hover:text-ui-fg-base',
            isCurrent && 'opacity-30',
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {error ? (
        <div className="py-6 text-center text-sm text-ui-fg-muted">{t('error')}</div>
      ) : loading ? (
        <div className="py-6 text-center text-sm text-ui-fg-muted">…</div>
      ) : (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { value: report.workouts, label: t('workouts') },
              { value: report.volume, label: t('volumeKg') },
              { value: report.sets, label: t('sets') },
              {
                value: period === 'day' ? (report.loggedDays ? report.kcal : '–') : (report.kcalPerLoggedDay ?? '–'),
                label: period === 'day' ? t('kcal') : t('kcalPerLoggedDay'),
              },
            ].map((stat, index) => (
              <div key={index} className="rounded-xl bg-ui-bg-subtle px-2 py-2.5 text-center">
                <div className="font-display text-2xl font-bold tabular-nums leading-none text-ui-fg-base">
                  {stat.value}
                </div>
                <div className={`mt-1 ${statLabelClass}`}>{stat.label}</div>
              </div>
            ))}
          </div>

          {period !== 'day' && (
            <div className="mt-2 text-center text-xs text-ui-fg-muted">
              {t('coverage', { logged: report.loggedDays, days: report.daysElapsed })}
            </div>
          )}
          {report.truncated && (
            <div className="mt-2 rounded-xl bg-ui-tag-orange-bg px-3 py-2 text-center text-xs text-ui-tag-orange-text">
              {t('truncated')}
            </div>
          )}

          {/* Weight change */}
          {report.weightEnd != null && (
            <div className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-ui-bg-subtle px-3 py-2 text-sm">
              <Scale size={14} className="text-ui-fg-muted" />
              <span className="font-semibold tabular-nums">{report.weightEnd} kg</span>
              {weightDelta !== null && (
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{
                    color:
                      weightDelta <= 0 ? 'var(--color-stat-green)' : 'var(--color-stat-amber)',
                  }}
                >
                  ({weightDelta > 0 ? '+' : ''}
                  {weightDelta} kg)
                </span>
              )}
            </div>
          )}

          {/* Sessions in period (day view: the day's detail) */}
          {report.sessions.length > 0 && period !== 'ytd' && (
            <ul className="mt-3 flex list-none flex-col gap-1.5 p-0">
              {report.sessions.slice(0, period === 'day' ? 5 : 6).map((session) => (
                <li key={session.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <CheckCircle2
                      size={14}
                      className="shrink-0"
                      style={{ color: 'var(--color-stat-green)' }}
                    />
                    <span className="truncate">{session.title || t('sessionFallback')}</span>
                  </span>
                  {session.completedAt && (
                    <span className={`shrink-0 ${statLabelClass}`}>
                      {format.dateTime(new Date(session.completedAt), {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {report.workouts === 0 && report.loggedDays === 0 && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ui-fg-muted">
              <Flame size={12} />
              {t('empty')}
            </div>
          )}
        </>
      )}
    </section>
  )
}
