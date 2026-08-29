'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { TimerReset, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const formatClock = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Rest countdown shown after logging a set, seeded from the prescribed rest.
 * Deadline-based (not tick-decrement), so a backgrounded phone tab stays accurate.
 */
export function RestTimer({
  seconds,
  startedAt,
  onDismiss,
}: {
  seconds: number
  /** Changes on every logged set so the timer restarts. */
  startedAt: number
  onDismiss: () => void
}) {
  const t = useTranslations('session')
  const [extraSeconds, setExtraSeconds] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const doneNotified = useRef(false)

  const deadline = startedAt + (seconds + extraSeconds) * 1000
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))

  useEffect(() => {
    if (remaining <= 0) return
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [remaining > 0, startedAt, extraSeconds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (remaining === 0 && !doneNotified.current) {
      doneNotified.current = true
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate?.([200, 100, 200])
        } catch {
          /* not supported */
        }
      }
    }
  }, [remaining])

  const done = remaining === 0

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ui-border-base bg-ui-bg-component px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.15)]"
      role="timer"
    >
      <div className="mx-auto flex max-w-135 items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm">
          <TimerReset size={16} className={done ? 'text-ui-fg-interactive' : 'text-ui-fg-muted'} />
          <span className={done ? 'font-semibold text-ui-fg-interactive' : 'text-ui-fg-base'}>
            {done ? t('restDone') : t('restLabel')}
          </span>
          {!done && (
            <span className="font-mono text-base font-semibold tabular-nums">
              {formatClock(remaining)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          {!done && (
            <Button size="sm" variant="secondary" type="button" onClick={() => setExtraSeconds((extra) => extra + 30)}>
              +30s
            </Button>
          )}
          <Button size="sm" variant="secondary" type="button" onClick={onDismiss} aria-label={t('restSkip')}>
            <X size={13} strokeWidth={2.5} />
          </Button>
        </span>
      </div>
    </div>
  )
}
