import type { CollectionConfig } from 'payload'
import { isAdmin, adminOrSelf, isAdminField } from '../../access'
import { validatePassword } from '../../lib/validate-password'

export const Clients: CollectionConfig = {
  slug: 'clients',
  auth: {
    tokenExpiration: 60 * 60 * 2, // 2h session
    maxLoginAttempts: 5,
    lockTime: 1000 * 60 * 10, // 10 min lockout after too many attempts
    cookies: {
      secure: process.env.NODE_ENV === 'production', // HTTPS-only cookie in prod
      sameSite: 'Lax',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email'],
    group: 'Accounts',
  },
  access: {
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
    admin: () => false,
  },
  hooks: {
    beforeValidate: [validatePassword],
  },
  // Audit trail for client account and trainer-note changes.
  versions: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full name',
    },
    {
      name: 'plans',
      type: 'join',
      collection: 'plans',
      on: 'client',
      label: "Client's plans",
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Trainer notes',
      access: {
        read: isAdminField,
        update: isAdminField,
      },
    },
  ],
}
