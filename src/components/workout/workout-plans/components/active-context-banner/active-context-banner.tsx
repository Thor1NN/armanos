'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { mutedTextClass, sectionLabelClass } from '@/lib/class-names'

export function ActiveContextBanner({
  planTitle,
  microcycleTitle,
  workoutTitle,
}: {
  planTitle: string
  microcycleTitle: string
  workoutTitle: string
}) {
  const t = useTranslations('workout')

  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle/60 px-4 py-2">
      <div className={sectionLabelClass}>{t('activeContext')}</div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ui-fg-base">
        <span>{planTitle}</span>
        <span className={mutedTextClass}>/</span>
        <span>{microcycleTitle}</span>
        <span className={mutedTextClass}>/</span>
        <span className="font-semibold">{workoutTitle}</span>
      </div>
    </div>
  )
}
