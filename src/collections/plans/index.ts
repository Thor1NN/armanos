import type { CollectionConfig } from 'payload'
import { isAdmin, adminOrOwnByClient } from '../../access'

export const Plans: CollectionConfig = {
  slug: 'plans',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'status', 'updatedAt'],
    group: 'Plan treningowy',
  },
  access: {
    create: isAdmin,
    read: adminOrOwnByClient,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Klient (właściciel planu)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'active',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Aktywny', value: 'active' },
        { label: 'Wstrzymany', value: 'paused' },
        { label: 'Zakończony', value: 'completed' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Początek',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Koniec',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Nazwa planu',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Opis',
    },
    {
      name: 'source',
      type: 'text',
      label: 'Źródło (plik)',
      admin: { description: 'Skąd zaimportowano plan' },
    },
  ],
}
