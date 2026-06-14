import type { CollectionConfig } from 'payload'
import { isAdmin, isAuthenticated } from '../../access'
import { trackingOptions, DEFAULT_TRACKING } from './types'

export const Exercises: CollectionConfig = {
  slug: 'exercises',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'muscleGroup', 'equipment'],
    group: 'Katalog',
  },
  access: {
    create: isAdmin,
    read: isAuthenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nazwa',
    },
    {
      name: 'trackingType',
      type: 'select',
      label: 'Typ pomiaru',
      defaultValue: DEFAULT_TRACKING,
      options: trackingOptions,
      admin: { description: 'Decyduje, które pola pokazuje formularz logowania serii' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Opis techniczny',
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Wideo (link)',
      admin: { description: 'URL do filmu instruktażowego (np. YouTube)' },
    },
    {
      name: 'muscleGroup',
      type: 'text',
      label: 'Partia mięśniowa',
    },
    {
      name: 'equipment',
      type: 'text',
      label: 'Sprzęt',
    },
  ],
}
