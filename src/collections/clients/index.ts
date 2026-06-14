import type { CollectionConfig } from 'payload'
import { isAdmin, adminOrSelf, isAdminField } from '../../access'

export const Clients: CollectionConfig = {
  slug: 'clients',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email'],
    group: 'Konta',
  },
  access: {
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
    admin: () => false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Imię i nazwisko',
    },
    {
      name: 'plans',
      type: 'join',
      collection: 'plans',
      on: 'client',
      label: 'Plany klienta',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notatki trenera',
      access: {
        read: isAdminField,
        update: isAdminField,
      },
    },
  ],
}
