import { headers as getHeaders } from 'next/headers.js'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { loadPlansItems } from '@/loaders/load-plans-items'
import type { TPlanAccordionItem } from '@/types/plan'

type LoadResult =
  | { user: { id: number | string; name?: string | null; email?: string | null }; plans: TPlanAccordionItem[] }
  | { user: null }

export async function loadTrainingPlans(): Promise<LoadResult> {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'clients') {
    return { user: null }
  }

  const t = await getTranslations('home')

  const plans = await payload.find({
    collection: 'plans',
    where: { client: { equals: user.id } },
    sort: '-createdAt',
    depth: 0,
    limit: 100,
  })

  const planIds = plans.docs.map((p) => p.id)

  const accordionPlans = await loadPlansItems(
    payload,
    planIds,
    {
      seriesPrefix: t('seriesPrefix'),
      durationPrefix: t('durationPrefix'),
      restPrefix: t('restPrefix'),
    },
    true,
  )

  return {
    user: { id: user.id, name: user.name ?? null, email: user.email ?? null },
    plans: accordionPlans,
  }
}
