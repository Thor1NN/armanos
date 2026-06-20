import type { CollectionConfig } from 'payload'
import { adminOrOwnByClient, canReadViaShareToken } from '../../access'

export const ExerciseLogs: CollectionConfig = {
  slug: 'exercise-logs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['exerciseRow', 'session', 'client'],
    group: 'Training log',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: async (ctx) => {
      const own = adminOrOwnByClient(ctx)
      if (own !== false) return own
      return canReadViaShareToken(ctx)
    },
    update: adminOrOwnByClient,
    delete: adminOrOwnByClient,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) return data
        if (req.user?.collection === 'clients' && data.session) {
          const session = await req.payload.findByID({
            collection: 'workout-logs',
            id: data.session,
            depth: 0,
          })
          const owner = typeof session.client === 'object' ? session.client?.id : session.client
          if (owner !== req.user.id) {
            throw new Error('You cannot add a note to someone else\'s session.')
          }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, req }) => {
        if (req.user?.collection === 'clients') {
          data.client = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'workout-logs',
      required: true,
      label: 'Session',
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Client',
      defaultValue: ({ user }) => (user?.collection === 'clients' ? user.id : undefined),
    },
    {
      name: 'exercise',
      type: 'relationship',
      relationTo: 'exercises',
      label: 'Exercise (catalog)',
    },
    {
      name: 'exerciseName',
      type: 'text',
      label: 'Exercise (name, snapshot)',
    },
    {
      name: 'exerciseRow',
      type: 'relationship',
      relationTo: 'workout-exercise-rows',
      required: true,
      label: 'Exercise row in workout',
    },
    {
      name: 'roundLog',
      type: 'relationship',
      relationTo: 'round-logs',
      label: 'Round',
      admin: { readOnly: true },
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Note',
    },
  ],
}
