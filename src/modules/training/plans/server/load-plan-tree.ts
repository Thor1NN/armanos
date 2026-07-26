import 'server-only'

import type { getPayload } from 'payload'

import { buildPlanTree, type ExerciseMetaLabels, type PlanTree } from '@/modules/training/plans'

import { loadPlanDocuments } from './load-plan-documents'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

export async function loadPlanTree(
  payload: PayloadInstance,
  planIds: (number | string)[],
  labels: ExerciseMetaLabels,
  overrideAccess = false,
): Promise<PlanTree[]> {
  const documents = await loadPlanDocuments(payload, planIds, overrideAccess)

  return buildPlanTree(documents, labels)
}
