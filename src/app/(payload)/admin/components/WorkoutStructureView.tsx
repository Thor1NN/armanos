import React from 'react'
import { WorkoutStructureEditor } from './WorkoutStructureEditor'

type Section = { id?: string; title?: string | null; subtitle?: string | null }

type Group = {
  id: number
  sectionRowId?: string | null
  order?: number | null
  label?: string | null
  protocol?: string | null
  rounds?: string | null
  durationMinutes?: number | null
  intervalSeconds?: number | null
  workSeconds?: number | null
  restSeconds?: number | null
  restBetweenRounds?: string | null
}

type RawExerciseRow = {
  id: number
  group?: number | { id: number } | null
  order?: number | null
  numer?: string | null
  exercise?: { id: number; name?: string | null } | number | null
  note?: string | null
  rounds?: string | null
  reps?: string | null
  kg?: string | null
  tut?: string | null
  rir?: string | null
  rest?: string | null
  durationMin?: number | null
  durationSec?: number | null
}

type ExerciseRow = {
  id: number
  group?: number | null
  order?: number | null
  numer?: string | null
  exercise?: { id: number; name?: string | null } | null
  note?: string | null
  rounds?: string | null
  reps?: string | null
  kg?: string | null
  tut?: string | null
  rir?: string | null
  rest?: string | null
  durationMin?: number | null
  durationSec?: number | null
}

type ExerciseCatalogItem = { id: number; name?: string | null }

export async function WorkoutStructureView({
  initPageResult,
  payload,
}: {
  initPageResult?: { docID?: number | string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any
}) {
  const docId = initPageResult?.docID

  if (!docId || docId === 'create' || !payload) {
    return (
      <div style={{ padding: '24px', color: '#9A9FA8', fontSize: 14 }}>
        Najpierw zapisz trening, aby zarządzać strukturą.
      </div>
    )
  }

  const workout = await payload.findByID({
    collection: 'workouts',
    id: docId,
    depth: 0,
  })

  const groupsResult = await payload.find({
    collection: 'workout-groups',
    where: { workout: { equals: docId } },
    sort: 'order',
    limit: 500,
    depth: 0,
  })

  const groupIds = groupsResult.docs.map((g: Group) => g.id)

  const exerciseRowsResult = groupIds.length
    ? await payload.find({
        collection: 'workout-exercise-rows',
        where: { group: { in: groupIds } },
        sort: 'order',
        limit: 5000,
        depth: 1,
      })
    : { docs: [] }

  const exercisesResult = await payload.find({
    collection: 'exercises',
    sort: 'name',
    limit: 1000,
    depth: 0,
  })

  const sections: Section[] = (workout.sections ?? []) as Section[]

  const groups: Group[] = groupsResult.docs.map((g: Group) => ({
    id: g.id,
    sectionRowId: g.sectionRowId ?? null,
    order: g.order ?? 0,
    label: g.label ?? null,
    protocol: g.protocol ?? 'standard',
    rounds: g.rounds ?? null,
    durationMinutes: g.durationMinutes ?? null,
    intervalSeconds: g.intervalSeconds ?? null,
    workSeconds: g.workSeconds ?? null,
    restSeconds: g.restSeconds ?? null,
    restBetweenRounds: g.restBetweenRounds ?? null,
  }))

  const exerciseRows: ExerciseRow[] = exerciseRowsResult.docs.map((r: RawExerciseRow) => ({
    id: r.id,
    group: typeof r.group === 'object' && r.group !== null ? r.group.id : (r.group ?? null),
    order: r.order ?? 0,
    numer: r.numer ?? null,
    rounds: r.rounds ?? null,
    exercise:
      r.exercise && typeof r.exercise === 'object'
        ? { id: (r.exercise as { id: number }).id, name: (r.exercise as { name?: string | null }).name ?? null }
        : null,
    note: r.note ?? null,
    reps: r.reps ?? null,
    kg: r.kg ?? null,
    tut: r.tut ?? null,
    rir: r.rir ?? null,
    rest: r.rest ?? null,
    durationMin: r.durationMin ?? null,
    durationSec: r.durationSec ?? null,
  }))

  const exerciseCatalog: ExerciseCatalogItem[] = exercisesResult.docs.map(
    (e: ExerciseCatalogItem) => ({ id: e.id, name: e.name ?? null }),
  )

  return (
    <WorkoutStructureEditor
      workoutId={Number(docId)}
      sections={sections}
      initialGroups={groups}
      initialExerciseRows={exerciseRows}
      exerciseCatalog={exerciseCatalog}
    />
  )
}
