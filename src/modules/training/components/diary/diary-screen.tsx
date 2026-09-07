'use client'

import { useFormatter, useTranslations } from 'next-intl'
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DailyDataProvider, atNoon, useDailyData } from '@/modules/training/components/daily'
import { DayTimeline } from './day-timeline'
import { EntryComposer } from './entry-composer'

/** Standalone diary page: day switcher, composer and the day's timeline. */
export function DiaryScreen() {
  return (
    <DailyDataProvider>
      <DiaryContent />
    </DailyDataProvider>
  )
}

function DiaryContent() {
  const t = useTranslations('diary')
  const format = useFormatter()
  const { date, key, isToday, shiftDay, refresh } = useDailyData()

  return (
    <div className="space-y-3">
      <div className="fx-card flex items-center justify-between px-2 py-1.5">
        <Button variant="icon" className="min-h-10 min-w-10" onClick={() => shiftDay(-1)} aria-label={t('prevDay')}>
          <ChevronLeft size={20} />
        </Button>
        <span className="text-sm font-semibold">
          {isToday ? t('today') : format.dateTime(atNoon(date), { weekday: 'short', day: 'numeric', month: 'long' })}
        </span>
        <Button
          variant="icon"
          className="min-h-10 min-w-10"
          onClick={() => shiftDay(1)}
          aria-label={t('nextDay')}
          disabled={isToday}
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      <div className="fx-card p-3">
        <EntryComposer key={key} dayKey={key} onSaved={refresh} />
      </div>

      <DayTimeline />
    </div>
  )
}
