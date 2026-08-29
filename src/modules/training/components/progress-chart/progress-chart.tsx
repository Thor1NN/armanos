'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { Select } from '@/components/ui/input'
import type { ExerciseProgressSeries } from '@/modules/training/logs/server'

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

  const selected = series.find((entry) => entry.exerciseName === selectedName) ?? series[0]

  const chart = useMemo(() => {
    if (!selected) return null
    const points = selected.points
    const weights = points.map((point) => point.topWeight ?? 0)
    const maxWeight = Math.max(...weights, 1)
    const minWeight = Math.min(...weights.filter((weight) => weight > 0), maxWeight)
    const span = Math.max(maxWeight - minWeight, 1)

    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
    const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0

    const coords = points.map((point, index) => ({
      ...point,
      x: PADDING.left + (points.length > 1 ? index * stepX : innerWidth / 2),
      y:
        PADDING.top +
        innerHeight -
        (((point.topWeight ?? minWeight) - minWeight) / span) * innerHeight,
    }))
    return { coords, minWeight, maxWeight }
  }, [selected])

  if (!selected || !chart) return null

  const hasWeights = selected.points.some((point) => (point.topWeight ?? 0) > 0)

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

      {hasWeights ? (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="mt-3 w-full"
          role="img"
          aria-label={t('chartAria', { exercise: selected.exerciseName })}
        >
          {/* Y-axis bounds */}
          <text x={4} y={PADDING.top + 4} className="fill-ui-fg-muted" fontSize={11}>
            {chart.maxWeight}
          </text>
          <text x={4} y={CHART_HEIGHT - PADDING.bottom} className="fill-ui-fg-muted" fontSize={11}>
            {chart.minWeight}
          </text>
          <line
            x1={PADDING.left}
            y1={CHART_HEIGHT - PADDING.bottom}
            x2={CHART_WIDTH - PADDING.right}
            y2={CHART_HEIGHT - PADDING.bottom}
            className="stroke-ui-border-base"
          />
          {chart.coords.length > 1 && (
            <polyline
              fill="none"
              strokeWidth={2}
              className="stroke-ui-fg-interactive"
              points={chart.coords.map((coord) => `${coord.x},${coord.y}`).join(' ')}
            />
          )}
          {chart.coords.map((coord) => (
            <g key={coord.sessionId}>
              <circle cx={coord.x} cy={coord.y} r={3.5} className="fill-ui-fg-interactive" />
              <text
                x={coord.x}
                y={coord.y - 8}
                textAnchor="middle"
                fontSize={11}
                className="fill-ui-fg-base"
              >
                {coord.topWeight ?? ''}
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
