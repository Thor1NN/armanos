import type { PlanTree } from '@/modules/training/plans'

export type LoadShareLinkOutput = {
  meta: {
    planTitle: string
    permissions: ('plan' | 'results')[]
    expiresAt: string
  }
  plan?: PlanTree[]
} | null
