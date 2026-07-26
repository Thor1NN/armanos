'use client'

import { useTranslations } from 'next-intl'
import React from 'react'
import { mutedTextClass } from '@/lib/class-names'

export function ExerciseHeader({
  numer,
  name,
  videoUrl,
}: {
  numer?: string | null
  name: string
  videoUrl?: string | null
}) {
  const t = useTranslations('exercise')

  return (
    <div className="break-words text-sm text-ui-fg-base">
      {numer ? <span className={`inline-block min-w-7 font-semibold ${mutedTextClass}`}>{numer}</span> : null}
      {name}
      {videoUrl && (
        <a
          className="ml-2 whitespace-nowrap text-xs text-ui-fg-interactive"
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('video')}
        </a>
      )}
    </div>
  )
}
