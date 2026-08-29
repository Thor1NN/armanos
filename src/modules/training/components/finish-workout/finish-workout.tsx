'use client'

import React, { useState } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkoutLog } from '@/payload-types'

/**
 * Finish-workout flow: explicit button → confirmation → idempotent server
 * completion. Once completed, shows a summary banner instead of the button.
 */
export function FinishWorkout({
  session,
  completed,
  onFinish,
}: {
  session: WorkoutLog | null
  completed: boolean
  onFinish: () => Promise<unknown>
}) {
  const t = useTranslations('session')
  const format = useFormatter()
  const [confirming, setConfirming] = useState(false)
  const [finishing, setFinishing] = useState(false)

  if (completed) {
    const when = session?.completedAt ? new Date(session.completedAt) : null
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2.5 text-sm">
        <CheckCircle2 size={16} className="shrink-0 text-ui-fg-interactive" />
        <span>
          {t('completedBanner')}
          {when && (
            <span className="text-ui-fg-muted">
              {' '}
              · {format.dateTime(when, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
        </span>
      </div>
    )
  }

  if (!session) return null

  if (confirming) {
    return (
      <div className="mt-3 rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2.5">
        <p className="mb-2 text-sm">{t('finishConfirmText')}</p>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            disabled={finishing}
            onClick={async () => {
              setFinishing(true)
              try {
                await onFinish()
              } finally {
                setFinishing(false)
                setConfirming(false)
              }
            }}
          >
            {finishing ? '…' : t('finishConfirmYes')}
          </Button>
          <Button size="sm" variant="secondary" disabled={finishing} onClick={() => setConfirming(false)}>
            {t('finishConfirmNo')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button className="mt-3 w-full" onClick={() => setConfirming(true)}>
      {t('finishButton')}
    </Button>
  )
}
