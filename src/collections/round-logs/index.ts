import type { CollectionConfig } from 'payload'
import { adminOrOwnByClient, isAdmin } from '../../access'

export const RoundLogs: CollectionConfig = {
  slug: 'round-logs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['session', 'group', 'roundNumber', 'status', 'client'],
    group: 'Dziennik treningów',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: adminOrOwnByClient,
    update: adminOrOwnByClient,
    delete: isAdmin,
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
      name: 'session',
      type: 'relationship',
      relationTo: 'workout-logs',
      required: true,
      label: 'Sesja',
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'workout-groups',
      required: true,
      label: 'Grupa',
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Klient',
      defaultValue: ({ user }) => (user?.collection === 'clients' ? user.id : undefined),
    },
    {
      name: 'roundNumber',
      type: 'number',
      label: 'Nr rundy',
      required: true,
    },
    {
      name: 'startedAt',
      type: 'date',
      label: 'Rozpoczęto',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'finishedAt',
      type: 'date',
      label: 'Zakończono',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'completed',
      options: [
        { label: 'Ukończona', value: 'completed' },
        { label: 'Częściowa', value: 'partial' },
        { label: 'Pominięta', value: 'skipped' },
      ],
    },
  ],
}
