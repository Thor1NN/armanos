import 'server-only'

import { headers as getHeaders } from 'next/headers.js'
import { getLocale, getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import type { LoadTrainingPlansOutput } from '@/modules/training/plans'

import { loadPlanTree } from './load-plan-tree'

export async function loadTrainingPlans(): Promise<LoadTrainingPlansOutput> {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'clients') {
    return { user: null }
  }

  const t = await getTranslations('home')
  const locale = await getLocale()

  const plans = await payload.find({
    collection: 'plans',
    where: { client: { equals: user.id } },
    sort: '-createdAt',
    depth: 0,
    limit: 100,
  })

  const planIds = plans.docs.map((plan) => plan.id)

  const planTree = await loadPlanTree(
    payload,
    planIds,
    {
      seriesPrefix: t('seriesPrefix'),
      durationPrefix: t('durationPrefix'),
      restPrefix: t('restPrefix'),
      statusActive: t('statusActive'),
      statusPaused: t('statusPaused'),
      statusCompleted: t('statusCompleted'),
    },
    true,
    locale || 'en-GB',
  )

  return {
    user: {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      dailyKcalTarget: user.dailyKcalTarget ?? null,
    },
    plans: planTree,
  }
}
