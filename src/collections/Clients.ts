import type { CollectionConfig } from 'payload'
import { isAdmin, adminOrSelf, isAdminField } from '../access'

export const Clients: CollectionConfig = {
  slug: 'clients',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email'],
    group: 'Konta',
  },
  access: {
    // Konta zakłada wyłącznie trener/admin (brak publicznej rejestracji)
    create: isAdmin,
    // Admin czyta wszystkich; klient tylko siebie
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
    // Klienci nie mają dostępu do panelu Payload (logują się przez tracker)
    admin: () => false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Imię i nazwisko',
    },
    {
      // Wszystkie plany tego klienta (klient ma wiele customowych planów)
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
