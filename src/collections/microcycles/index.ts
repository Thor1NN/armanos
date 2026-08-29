import { APIError, type CollectionConfig } from 'payload'

import { isAdmin } from '../../access'

export const Microcycles: CollectionConfig = {
  slug: 'microcycles',
  access: {
    create: isAdmin,
    // Plan structure is loaded server-side with ownership already resolved
    // (see modules/training/plans/server) — direct API reads are coach-only.
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const workouts = await req.payload.find({
          collection: 'workouts',
          where: { microcycle: { equals: id } },
          depth: 0,
          limit: 10000,
          pagination: false,
        })
        const workoutIds = workouts.docs.map((doc) => doc.id)
        if (!workoutIds.length) return
        const logs = await req.payload.count({
          collection: 'workout-logs',
          where: { workout: { in: workoutIds } },
        })
        if (logs.totalDocs > 0) {
          throw new APIError(
            'Cannot delete a microcycle that already has logged sessions.',
            400,
          )
        }
      },
    ],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rpe', 'order', 'plan'],
    group: 'Training plan',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Microcycle name',
    },
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'plans',
      required: true,
      label: 'Plan',
    },
    {
      name: 'rpe',
      type: 'number',
      label: 'RPE',
      admin: { description: 'Target RPE for the microcycle (6–9)' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Order',
      defaultValue: 0,
    },
    {
      name: 'workoutsNavigation',
      type: 'ui',
      label: '',
      admin: {
        components: {
          Field: {
            path: '@/modules/training/admin/training-navigation/training-navigation',
            exportName: 'MicrocycleWorkouts',
          },
        },
      },
    },
  ],
}
