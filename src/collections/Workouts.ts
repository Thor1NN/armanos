import type { CollectionConfig } from 'payload'

type WorkoutSection = {
  groups?: Array<{
    exercises?: Array<{
      id?: string | null
    }>
  }>
}

const getWorkoutExerciseRowIds = (sections?: WorkoutSection[] | null) => {
  const rowIds = new Set<string>()

  for (const section of sections ?? []) {
    for (const group of section.groups ?? []) {
      for (const exercise of group.exercises ?? []) {
        if (exercise.id) {
          rowIds.add(String(exercise.id))
        }
      }
    }
  }

  return rowIds
}

const hasWorkoutLogs = async (
  req: {
    payload: {
      count: (args: {
        collection: 'workout-logs'
        limit: number
        where: { workout: { equals: number | string } }
      }) => Promise<{ totalDocs: number }>
    }
  },
  workoutId: number | string,
) => {
  const result = await req.payload.count({
    collection: 'workout-logs',
    limit: 1,
    where: { workout: { equals: workoutId } },
  })

  return result.totalDocs > 0
}

export const Workouts: CollectionConfig = {
  slug: 'workouts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rpe', 'order', 'microcycle'],
    group: 'Plan treningowy',
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (operation !== 'update' || !originalDoc?.id || !data.sections) {
          return data
        }

        if (!(await hasWorkoutLogs(req, originalDoc.id))) {
          return data
        }

        const previousRowIds = getWorkoutExerciseRowIds(originalDoc.sections as WorkoutSection[] | null)
        const nextRowIds = getWorkoutExerciseRowIds(data.sections as WorkoutSection[] | null)

        const removedRowIds = [...previousRowIds].filter((rowId) => !nextRowIds.has(rowId))

        if (removedRowIds.length > 0) {
          throw new Error(
            'Nie mozna usuwac istniejacych cwiczen z treningu, ktory ma juz zapisane logi. Dodaj nowa wersje treningu zamiast przebudowywac stara.',
          )
        }

        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        if (await hasWorkoutLogs(req, id)) {
          throw new Error(
            'Nie mozna usunac treningu, ktory ma juz zapisane logi. Najpierw usun logi albo utworz nowa wersje treningu.',
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'workoutLogsNotice',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/app/(payload)/admin/components/WorkoutLogsNotice',
            exportName: 'WorkoutLogsNotice',
          },
        },
      },
      label: '',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Nazwa treningu',
    },
    {
      name: 'microcycle',
      type: 'relationship',
      relationTo: 'microcycles',
      required: true,
      label: 'Mikrocykl',
    },
    {
      name: 'rpe',
      type: 'number',
      label: 'RPE',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Kolejność',
      defaultValue: 0,
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Sekcje',
      labels: { singular: 'Sekcja', plural: 'Sekcje' },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Tytuł sekcji',
          admin: { description: 'np. Rozgrzewka, Część główna' },
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Podtytuł',
          admin: { description: 'np. Upper Body, EMOM' },
        },
        {
          name: 'groups',
          type: 'array',
          label: 'Grupy serii',
          labels: { singular: 'Grupa', plural: 'Grupy' },
          fields: [
            {
              name: 'setType',
              type: 'text',
              label: 'Typ serii',
              admin: { description: 'np. Serie wstępne / Serie główne' },
            },
            {
              name: 'exercises',
              type: 'array',
              label: 'Ćwiczenia',
              labels: { singular: 'Ćwiczenie', plural: 'Ćwiczenia' },
              fields: [
                { name: 'numer', type: 'text', label: 'Numer' },
                {
                  name: 'exercise',
                  type: 'relationship',
                  relationTo: 'exercises',
                  label: 'Ćwiczenie (katalog)',
                  admin: { description: 'Powiązanie z katalogiem — do wideo i progresu' },
                },
                {
                  name: 'note',
                  type: 'text',
                  label: 'Uwaga / wariant',
                  admin: {
                    description: 'Opcjonalnie — gdy nazwa z katalogu nie wystarcza (wskazówka, wariant, instrukcja)',
                  },
                },
                { name: 'series', type: 'text', label: 'Serie' },
                { name: 'reps', type: 'text', label: 'Powtórzenia' },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'durationMin',
                      type: 'number',
                      label: 'Czas — minuty',
                      min: 0,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'durationSec',
                      type: 'number',
                      label: 'Czas — sekundy',
                      min: 0,
                      max: 59,
                      admin: { width: '50%' },
                    },
                  ],
                },
                { name: 'rest', type: 'text', label: 'Przerwa' },
                { name: 'tut', type: 'text', label: 'TUT' },
                { name: 'rir', type: 'text', label: 'RIR' },
                { name: 'kg', type: 'text', label: 'KG' },
                {
                  name: 'extra',
                  type: 'text',
                  label: 'Dodatkowe',
                  admin: { description: 'Nietypowe kolumny (EMOM itd.)' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
