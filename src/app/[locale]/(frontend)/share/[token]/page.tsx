import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { loadShareLink } from '@/loaders/share-link-loader'
import { WorkoutPlansAccordion } from '@/components/workout/workout-plans-accordion'

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string; locale: string }>
}) {
  const { token } = await params
  const data = await loadShareLink(token)

  if (!data) notFound()

  const t = await getTranslations('share')
  const expiryDate = new Date(data.meta.expiresAt).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <img src="/images/logo.svg" alt="Logo" className="mb-3 h-7 w-auto sm:h-8" />
          <h1 className="text-lg font-semibold text-ui-fg-base sm:text-xl">{data.meta.planTitle}</h1>
        </div>
        <span className="shrink-0 text-xs text-ui-fg-muted">
          {t('expiresOn', { date: expiryDate })}
        </span>
      </div>

      {data.plan && <WorkoutPlansAccordion plans={data.plan} readOnly={true} />}
    </div>
  )
}
