import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
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
  fields: [],
  versions: false,
}
