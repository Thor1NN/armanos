import type { CollectionConfig } from 'payload'
import { adminOrOwnByClient, canReadViaShareToken } from '../../access'
import { trackingFields, ALL_METRIC_FIELDS, LEGACY_SET_LOG_FIELDS } from '../exercises/types'

export const SetLogs: CollectionConfig = {
  slug: 'set-logs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['exerciseName', 'setNumber', 'weightLeft', 'weightRight', 'repsLeft', 'repsRight', 'client'],
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
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        if (req.user?.collection === 'clients' && data.session) {
          const session = await req.payload.findByID({
            collection: 'workout-logs',
            id: data.session,
            depth: 0,
          })
          const owner = typeof session.client === 'object' ? session.client?.id : session.client
          if (owner !== req.user.id) {
            throw new Error('You cannot log sets to someone else\'s session.')
          }
        }
        const exerciseRowId = data.exerciseRow ?? originalDoc?.exerciseRow
        const exerciseRow = exerciseRowId
          ? await req.payload.findByID({
              collection: 'workout-exercise-rows',
              id: exerciseRowId,
              depth: 0,
            })
          : null

        if (exerciseRow?.targetType === 'duration') {
          const allowedFields = new Set<string>(['weightLeft', 'weightRight', 'durationSec', ...LEGACY_SET_LOG_FIELDS])
          for (const field of [...ALL_METRIC_FIELDS, ...LEGACY_SET_LOG_FIELDS]) {
            if (!allowedFields.has(field)) data[field] = null
          }
        } else if (data.exercise) {
          const ex = await req.payload.findByID({
            collection: 'exercises',
            id: data.exercise,
            depth: 0,
          })
          const allowed = trackingFields(ex?.trackingType)
          const allowedFields = new Set<string>([...allowed, ...LEGACY_SET_LOG_FIELDS])
          for (const field of [...ALL_METRIC_FIELDS, ...LEGACY_SET_LOG_FIELDS]) {
            if (!allowedFields.has(field)) data[field] = null
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
      label: 'Exercise row in workout',
      admin: { readOnly: true },
    },
    {
      name: 'roundLog',
      type: 'relationship',
      relationTo: 'round-logs',
      label: 'Round',
      admin: { readOnly: true },
    },
    {
      name: 'setNumber',
      type: 'number',
      label: 'Set number',
    },
    {
      name: 'weight',
      type: 'number',
      label: 'Weight (kg)',
      admin: { hidden: true },
    },
    {
      name: 'weightLeft',
      type: 'number',
      label: 'Weight left (kg)',
    },
    {
      name: 'weightRight',
      type: 'number',
      label: 'Weight right (kg)',
    },
    {
      name: 'isBodyweight',
      type: 'checkbox',
      label: 'Bodyweight',
      defaultValue: false,
    },
    {
      name: 'distanceM',
      type: 'number',
      label: 'Distance (m)',
    },
    {
      name: 'durationSec',
      type: 'number',
      label: 'Duration (s)',
    },
    {
      name: 'reps',
      type: 'text',
      label: 'Reps',
      admin: { hidden: true },
    },
    {
      name: 'repsLeft',
      type: 'text',
      label: 'Reps left',
    },
    {
      name: 'repsRight',
      type: 'text',
      label: 'Reps right',
    },
    {
      name: 'rir',
      type: 'text',
      label: 'RIR',
      admin: { hidden: true },
    },
    {
      name: 'note',
      type: 'text',
      label: 'Note',
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Completed',
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
