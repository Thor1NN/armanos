import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { loadPlansItems } from '@/loaders/load-plans-items'
import type { TPlanAccordionItem } from '@/types/plan'

export type TShareLinkData = {
  meta: {
    planTitle: string
    permissions: ('plan' | 'results')[]
    expiresAt: string
  }
  plan?: TPlanAccordionItem[]
} | null

export async function loadShareLink(token: string): Promise<TShareLinkData> {
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

  let planData: TPlanAccordionItem[] | undefined

  if (permissions.includes('plan')) {
    planData = await loadPlansItems(
      payload,
      [planId],
      {
        seriesPrefix: t('seriesPrefix'),
        repsPrefix: t('repsPrefix'),
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
