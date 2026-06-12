import { APIError, type CollectionConfig } from 'payload'

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
    beforeDelete: [
      async ({ id, req }) => {
        if (await hasWorkoutLogs(req, id)) {
          throw new APIError(
            'Nie mozna usunac treningu, ktory ma juz zapisane logi. Najpierw usun logi albo utworz nowa wersje treningu.',
            400,
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
      ],
    },
  ],
}
