import type { CollectionConfig } from 'payload'

export const Microcycles: CollectionConfig = {
  slug: 'microcycles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rpe', 'order', 'plan'],
    group: 'Plan treningowy',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Nazwa mikrocyklu',
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
      admin: { description: 'Docelowy RPE mikrocyklu (6–9)' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Kolejność',
      defaultValue: 0,
    },
  ],
}
