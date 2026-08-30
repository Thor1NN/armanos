'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React from 'react'
import { statLabelClass } from '@/lib/class-names'

const dayKey = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** WHOOP-style 7-day strip: green dot = a workout was completed that day. */
export function WeekStrip({ completedDates }: { completedDates: string[] }) {
  const t = useTranslations('dashboard')
  const format = useFormatter()
  const trained = new Set(completedDates.map((iso) => dayKey(new Date(iso))))

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return date
  })
  const todayKey = dayKey(new Date())
  const trainedCount = days.filter((date) => trained.has(dayKey(date))).length

  return (
    <div className="fx-card fx-in p-4" style={{ animationDelay: '200ms' }}>
      <div className={`mb-3 flex items-center justify-between ${statLabelClass}`}>
        <span>{t('weekLabel')}</span>
        <span style={{ color: 'var(--color-stat-green)' }}>
          {t('weekCount', { count: trainedCount })}
        </span>
      </div>
      <div className="flex items-start justify-between">
        {days.map((date) => {
          const key = dayKey(date)
          const isTrained = trained.has(key)
          const isToday = key === todayKey
          return (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <span className={statLabelClass}>
                {format.dateTime(date, { weekday: 'short' }).slice(0, 2)}
              </span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
                style={{
                  background: isTrained
                    ? 'color-mix(in srgb, var(--color-stat-green) 18%, transparent)'
                    : 'transparent',
                  color: isTrained ? 'var(--color-stat-green)' : 'var(--color-ui-fg-muted)',
                  border: isToday
                    ? '1.5px solid var(--color-stat-blue)'
                    : '1.5px solid var(--color-ui-border-base)',
                  boxShadow: isTrained
                    ? '0 0 8px color-mix(in srgb, var(--color-stat-green) 35%, transparent)'
                    : undefined,
                }}
              >
                {date.getDate()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
