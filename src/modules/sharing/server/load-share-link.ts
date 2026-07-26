import 'server-only'

import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import type { PlanTree } from '@/modules/training/plans'
import { loadPlanTree } from '@/modules/training/plans/server'
import type { LoadShareLinkOutput } from '@/modules/sharing'

export async function loadShareLink(token: string): Promise<LoadShareLinkOutput> {
  const payload = await getPayload({ config: await config })

  const result = await payload.find({
    collection: 'share-links',
    where: { token: { equals: token } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })

  const link = result.docs[0]

  if (!link) return null
  if (!link.active) return null
  if (new Date(link.expiresAt) < new Date()) return null

  const plan = typeof link.plan === 'object' ? link.plan : null
  const planId = typeof link.plan === 'object' ? link.plan.id : link.plan
  const planTitle = plan?.title ?? ''
  const permissions = link.permissions as ('plan' | 'results')[]

  const t = await getTranslations('share')

  let planData: PlanTree[] | undefined

  if (permissions.includes('plan')) {
    planData = await loadPlanTree(
      payload,
      [planId],
      {
        seriesPrefix: t('seriesPrefix'),
        durationPrefix: t('durationPrefix'),
        restPrefix: t('restPrefix'),
      },
      true,
    )
  }

  return {
    meta: { planTitle, permissions, expiresAt: link.expiresAt },
    plan: planData,
  }
}
