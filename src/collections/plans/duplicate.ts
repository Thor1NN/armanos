import type { PayloadRequest } from 'payload'

type AnyDoc = Record<string, unknown> & { id: number }

const relId = (value: unknown): number | null =>
  value && typeof value === 'object' ? ((value as { id: number }).id ?? null) : ((value as number) ?? null)

const stripMeta = (doc: AnyDoc, omit: string[] = []): Record<string, unknown> => {
  const skip = new Set(['id', 'createdAt', 'updatedAt', ...omit])
  return Object.fromEntries(Object.entries(doc).filter(([key]) => !skip.has(key)))
}

/**
 * Deep-copies a plan (microcycles → workouts → groups → exercise rows) to a
 * target client. Admin only. This is how reusable templates work: keep a
 * template plan anywhere and duplicate it to a client when assigning.
 *
 * POST /api/plans/:id/duplicate  body: { clientId?: number, title?: string }
 */
export const duplicatePlanHandler = async (req: PayloadRequest) => {
  if (req.user?.collection !== 'users') {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const planId = Number(req.routeParams?.id)
  if (!Number.isInteger(planId)) {
    return Response.json({ message: 'Invalid plan id.' }, { status: 400 })
  }
  const body = ((typeof req.json === 'function' ? await req.json() : null) ?? {}) as {
    clientId?: number | string
    title?: string
  }

  const { payload } = req
  const source = (await payload.findByID({
    collection: 'plans',
    id: planId,
    depth: 0,
  })) as unknown as AnyDoc

  if (body.clientId) {
    // Validate the target client exists before copying anything.
    await payload.findByID({ collection: 'clients', id: body.clientId, depth: 0 })
  }

  const newPlan = await payload.create({
    collection: 'plans',
    depth: 0,
    data: {
      ...stripMeta(source, ['client', 'microcyclesNavigation']),
      title: body.title || `${source.title} (copy)`,
      client: body.clientId ?? null,
      status: 'paused',
    } as never,
  })

  const microcycles = await payload.find({
    collection: 'microcycles',
    where: { plan: { equals: planId } },
    sort: 'order',
    depth: 0,
    limit: 500,
    pagination: false,
  })

  let workoutCount = 0
  let rowCount = 0

  for (const microcycle of microcycles.docs as unknown as AnyDoc[]) {
    const newMicrocycle = await payload.create({
      collection: 'microcycles',
      depth: 0,
      data: {
        ...stripMeta(microcycle, ['plan', 'workoutsNavigation']),
        plan: newPlan.id,
      } as never,
    })

    const workouts = await payload.find({
      collection: 'workouts',
      where: { microcycle: { equals: microcycle.id } },
      sort: 'order',
      depth: 0,
      limit: 1000,
      pagination: false,
    })

    for (const workout of workouts.docs as unknown as AnyDoc[]) {
      const sourceSections = (workout.sections ?? []) as Array<{
        id?: string
        title?: string
        subtitle?: string
      }>
      const newWorkout = (await payload.create({
        collection: 'workouts',
        depth: 0,
        data: {
          ...stripMeta(workout, ['microcycle', 'structureNavigation']),
          sections: sourceSections.map(({ title, subtitle }) => ({ title, subtitle })),
          microcycle: newMicrocycle.id,
        } as never,
      })) as unknown as AnyDoc
      workoutCount += 1

      // Section array rows get fresh ids on create — map old id → new id by
      // position so groups can re-attach to the right section.
      const newSections = (newWorkout.sections ?? []) as Array<{ id?: string }>
      const sectionIdMap = new Map<string, string>()
      sourceSections.forEach((section, index) => {
        const oldId = section.id
        const newId = newSections[index]?.id
        if (oldId && newId) sectionIdMap.set(oldId, newId)
      })

      const groups = await payload.find({
        collection: 'workout-groups',
        where: { workout: { equals: workout.id } },
        sort: 'order',
        depth: 0,
        limit: 1000,
        pagination: false,
      })

      for (const group of groups.docs as unknown as AnyDoc[]) {
        const oldSectionRowId = (group.sectionRowId as string) ?? null
        const newGroup = await payload.create({
          collection: 'workout-groups',
          depth: 0,
          data: {
            ...stripMeta(group, ['workout']),
            workout: newWorkout.id,
            sectionRowId: oldSectionRowId ? (sectionIdMap.get(oldSectionRowId) ?? null) : null,
          } as never,
        })

        const rows = await payload.find({
          collection: 'workout-exercise-rows',
          where: { group: { equals: group.id } },
          sort: 'order',
          depth: 0,
          limit: 1000,
          pagination: false,
        })

        for (const row of rows.docs as unknown as AnyDoc[]) {
          const setParameters = (row.setParameters ?? []) as Array<Record<string, unknown>>
          await payload.create({
            collection: 'workout-exercise-rows',
            depth: 0,
            data: {
              ...stripMeta(row, ['group']),
              group: newGroup.id,
              exercise: relId(row.exercise),
              setParameters: setParameters.map((setParam) => stripMeta(setParam as AnyDoc)),
            } as never,
          })
          rowCount += 1
        }
      }
    }
  }

  return Response.json({
    plan: { id: newPlan.id, title: newPlan.title },
    copied: { microcycles: microcycles.docs.length, workouts: workoutCount, exerciseRows: rowCount },
  })
}
