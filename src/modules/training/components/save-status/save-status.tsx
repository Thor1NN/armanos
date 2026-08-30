'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Check, CloudOff, Loader2 } from 'lucide-react'
import type { SaveStatus } from '@/modules/training/components/workout-tracker/hooks/use-workout-session'

/** Visible autosave state: Saving… / Saved / Failed. Hidden while idle. */
export function SaveStatusChip({ status }: { status: SaveStatus }) {
  const t = useTranslations('session')

  if (status === 'idle') return null

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ui-fg-muted" role="status">
        <Loader2 size={12} className="animate-spin" />
        {t('saving')}
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold"
        style={{ color: 'var(--color-stat-red)' }}
        role="status"
      >
        <CloudOff size={12} />
        {t('saveFailed')}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color: 'var(--color-stat-green)' }}
      role="status"
    >
      <Check size={12} />
      {t('saved')}
    </span>
  )
}
