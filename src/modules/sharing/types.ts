import type { TPlanAccordionItem } from '@/modules/training/plans'

export type ShareLinkData = {
  meta: {
    planTitle: string
    permissions: ('plan' | 'results')[]
    expiresAt: string
  }
  plan?: TPlanAccordionItem[]
} | null
