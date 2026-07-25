import type { CollectionConfig } from 'payload'

import { isAdmin, isAuthenticated } from '../../access'

export const Microcycles: CollectionConfig = {
  slug: 'microcycles',
  access: {
    create: isAdmin,
    read: isAuthenticated,
    update: isAdmin,
    delete: isAdmin,
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
