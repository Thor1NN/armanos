import type { CollectionConfig } from 'payload'
import { adminOrOwnByClient } from '../../access'

const MAX_TEXT_LENGTH = 2000

/**
 * Client daily diary: quick entries for meals eaten, activities done, and
 * free notes. Written by the client from the app, read by the coach in the
 * admin. Strictly owner-scoped — the client relation is always set
 * server-side from the session.
 */
export const DiaryEntries: CollectionConfig = {
  slug: 'diary-entries',
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['client', 'entryDate', 'kind', 'text'],
    group: 'Training log',
  },
  indexes: [
    {
      fields: ['client', 'entryDate'],
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
      name: 'entryDate',
      type: 'date',
      required: true,
      label: 'Date',
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'meal',
      label: 'Type',
      options: [
        { label: 'Meal', value: 'meal' },
        { label: 'Activity', value: 'activity' },
        { label: 'Note', value: 'note' },
      ],
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Entry',
      maxLength: MAX_TEXT_LENGTH,
      validate: (value: string | null | undefined) => {
        if (!value || !value.trim()) return 'Entry text is required.'
        if (value.length > MAX_TEXT_LENGTH) return `Keep entries under ${MAX_TEXT_LENGTH} characters.`
        return true
      },
    },
  ],
}
