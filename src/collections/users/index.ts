import type { CollectionConfig } from 'payload'
import { isAdmin } from '../../access'
import { validatePassword } from '../../lib/validate-password'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Coach/staff accounts are visible to staff only — without this, Payload's
    // default lets any authenticated client read coach emails via /api/users.
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  auth: {
    tokenExpiration: 60 * 60 * 2, // 2h session
    maxLoginAttempts: 5,
    lockTime: 1000 * 60 * 10, // 10 min lockout after too many attempts
    cookies: {
      secure: process.env.NODE_ENV === 'production', // HTTPS-only cookie in prod
      sameSite: 'Lax',
    },
  },
  hooks: {
    beforeValidate: [validatePassword],
  },
  fields: [],
  versions: false,
}
