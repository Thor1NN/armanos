'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { statLabelClass } from '@/lib/class-names'
import { Select } from '@/components/ui/input'
import type { ExerciseProgressPoint, ExerciseProgressSeries } from '@/modules/training/logs/server'

const METRICS = ['topWeight', 'bestE1rm', 'volume'] as const
type Metric = (typeof METRICS)[number]
const metricValue = (point: ExerciseProgressPoint, metric: Metric): number =>
  (metric === 'topWeight' ? point.topWeight : metric === 'bestE1rm' ? point.bestE1rm : point.volume) ?? 0

const CHART_WIDTH = 640
const CHART_HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 28, left: 40 }

/**
 * Dependency-free per-exercise progress chart: top-set weight across
 * completed sessions, with total reps shown under each point.
 */
export function ProgressChart({ series }: { series: ExerciseProgressSeries[] }) {
  const t = useTranslations('progress')
  const format = useFormatter()
  const [selectedName, setSelectedName] = useState(series[0]?.exerciseName ?? '')
  const [metric, setMetric] = useState<Metric>('topWeight')

  const selected = series.find((entry) => entry.exerciseName === selectedName) ?? series[0]

  const chart = useMemo(() => {
    if (!selected) return null
    const points = selected.points
    const values = points.map((point) => metricValue(point, metric))
    const maxValue = Math.max(...values, 1)
    const minValue = Math.min(...values.filter((value) => value > 0), maxValue)
    const span = Math.max(maxValue - minValue, 1)

    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
    const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0

    const coords = points.map((point, index) => ({
      ...point,
      value: metricValue(point, metric) || null,
      x: PADDING.left + (points.length > 1 ? index * stepX : innerWidth / 2),
      y:
        PADDING.top +
        innerHeight -
        ((Math.max(metricValue(point, metric), minValue) - minValue) / span) * innerHeight,
    }))
    return { coords, minValue, maxValue }
  }, [selected, metric])

  if (!selected || !chart) return null

  const hasWeights = selected.points.some((point) => metricValue(point, metric) > 0)
  const records = {
    topWeight: Math.max(...selected.points.map((point) => point.topWeight ?? 0), 0),
    bestE1rm: Math.max(...selected.points.map((point) => point.bestE1rm ?? 0), 0),
    volume: Math.max(...selected.points.map((point) => point.volume ?? 0), 0),
  }

  return (
    <div className="rounded-xl border border-ui-border-base bg-ui-bg-component px-4 py-3">
      <label className="mb-2 block text-xs font-medium text-ui-fg-muted" htmlFor="exercise-select">
        {t('exerciseLabel')}
      </label>
      <Select
        id="exercise-select"
        value={selected.exerciseName}
        onChange={(event) => setSelectedName(event.target.value)}
      >
        {series.map((entry) => (
          <option key={entry.exerciseName} value={entry.exerciseName}>
            {entry.exerciseName}
          </option>
        ))}
      </Select>

      {/* Metric switcher */}
      <div className="mt-2 flex gap-1">
        {METRICS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMetric(option)}
            className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
            style={
              metric === option
                ? {
                    borderColor: 'var(--color-stat-green)',
                    color: 'var(--color-stat-green)',
                    background: 'color-mix(in srgb, var(--color-stat-green) 10%, transparent)',
                  }
                : { borderColor: 'var(--color-ui-border-base)', color: 'var(--color-ui-fg-muted)' }
            }
          >
            {t(`metric_${option}`)}
          </button>
        ))}
      </div>

      {/* Records */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {METRICS.map((option) => (
          <div key={option} className="rounded-xl bg-ui-bg-subtle px-2 py-2">
            <Trophy size={12} className="mx-auto mb-1" style={{ color: 'var(--color-stat-amber)' }} />
            <div className="font-display text-lg font-bold tabular-nums leading-none text-ui-fg-base">
              {records[option] > 0 ? Math.round(records[option] * 10) / 10 : '—'}
            </div>
            <div className={`mt-0.5 ${statLabelClass}`}>{t(`record_${option}`)}</div>
          </div>
        ))}
      </div>

      {hasWeights ? (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="mt-3 w-full"
          role="img"
          aria-label={t('chartAria', { exercise: selected.exerciseName })}
        >
          <defs>
            <linearGradient id="progress-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-stat-green)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-stat-green)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Y-axis bounds */}
          <text x={4} y={PADDING.top + 4} className="fill-ui-fg-muted" fontSize={11}>
            {chart.maxValue}
          </text>
          <text x={4} y={CHART_HEIGHT - PADDING.bottom} className="fill-ui-fg-muted" fontSize={11}>
            {chart.minValue}
          </text>
          <line
            x1={PADDING.left}
            y1={CHART_HEIGHT - PADDING.bottom}
            x2={CHART_WIDTH - PADDING.right}
            y2={CHART_HEIGHT - PADDING.bottom}
            className="stroke-ui-border-base"
          />
          {chart.coords.length > 1 && (
            <polygon
              fill="url(#progress-area)"
              points={`${chart.coords[0].x},${CHART_HEIGHT - PADDING.bottom} ${chart.coords
                .map((coord) => `${coord.x},${coord.y}`)
                .join(' ')} ${chart.coords[chart.coords.length - 1].x},${CHART_HEIGHT - PADDING.bottom}`}
            />
          )}
          {chart.coords.length > 1 && (
            <polyline
              fill="none"
              strokeWidth={2.5}
              stroke="var(--color-stat-green)"
              style={{ filter: 'drop-shadow(0 0 6px color-mix(in srgb, var(--color-stat-green) 60%, transparent))' }}
              points={chart.coords.map((coord) => `${coord.x},${coord.y}`).join(' ')}
            />
          )}
          {chart.coords.map((coord) => (
            <g key={coord.sessionId}>
              <circle cx={coord.x} cy={coord.y} r={3.5} fill="var(--color-stat-green)" />
              <text
                x={coord.x}
                y={coord.y - 8}
                textAnchor="middle"
                fontSize={11}
                className="fill-ui-fg-base"
              >
                {coord.value ?? ''}
              </text>
              <text
                x={coord.x}
                y={CHART_HEIGHT - PADDING.bottom + 14}
                textAnchor="middle"
                fontSize={10}
                className="fill-ui-fg-muted"
              >
                {format.dateTime(new Date(coord.date), { day: 'numeric', month: 'numeric' })}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <p className="mt-3 text-sm text-ui-fg-muted">{t('noWeightData')}</p>
      )}

      <div className="mt-2 text-xs text-ui-fg-muted">
        {t('sessionsCount', { count: selected.points.length })}
        {selected.points.some((point) => point.totalReps) && (
          <>
            {' · '}
            {t('lastTotalReps', {
              count: selected.points[selected.points.length - 1]?.totalReps ?? 0,
            })}
          </>
        )}
      </div>
    </div>
  )
}
