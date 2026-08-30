import type { CollectionConfig } from 'payload'
import { adminOrOwnByClient } from '../../access'
import { validateNonNegative, validateWeight } from '../shared/log-integrity'

/**
 * Client body measurements: bodyweight (kg, 0.25 steps) plus optional
 * circumferences (cm). Owner-scoped like all logs; the client relation is
 * always set server-side.
 */
export const BodyMeasurements: CollectionConfig = {
  slug: 'body-measurements',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['client', 'measuredAt', 'weightKg', 'waistCm'],
    group: 'Training log',
  },
  indexes: [
    {
      fields: ['client', 'measuredAt'],
    },
  ],
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: adminOrOwnByClient,
    update: adminOrOwnByClient,
    delete: adminOrOwnByClient,
  },
  hooks: {
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
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Client',
      index: true,
      defaultValue: ({ user }) => (user?.collection === 'clients' ? user.id : undefined),
    },
    {
      name: 'measuredAt',
      type: 'date',
      required: true,
      label: 'Date',
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'weightKg',
      type: 'number',
      label: 'Body weight (kg)',
      validate: validateWeight,
    },
    {
      type: 'row',
      fields: [
        { name: 'chestCm', type: 'number', label: 'Chest (cm)', validate: validateNonNegative, admin: { width: '20%' } },
        { name: 'waistCm', type: 'number', label: 'Waist (cm)', validate: validateNonNegative, admin: { width: '20%' } },
        { name: 'hipCm', type: 'number', label: 'Hip (cm)', validate: validateNonNegative, admin: { width: '20%' } },
        { name: 'armCm', type: 'number', label: 'Arm (cm)', validate: validateNonNegative, admin: { width: '20%' } },
        { name: 'thighCm', type: 'number', label: 'Thigh (cm)', validate: validateNonNegative, admin: { width: '20%' } },
      ],
    },
    {
      name: 'note',
      type: 'text',
      label: 'Note',
    },
  ],
}
