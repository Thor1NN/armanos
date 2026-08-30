import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import { isAdmin, adminOrSelf, isAdminField } from '../../access'
import { validatePassword } from '../../lib/validate-password'
import { exportCsvHandler } from './export-csv'

/**
 * Generates a one-time set-password link for a client (no email service
 * required — the coach copies the link and sends it however they like).
 * Uses Payload's built-in reset-password token; valid for 1 hour.
 */
const inviteHandler = async (req: PayloadRequest) => {
  if (req.user?.collection !== 'users') {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const id = req.routeParams?.id
  if (!id) return Response.json({ message: 'Client id is required.' }, { status: 400 })

  const client = await req.payload.findByID({ collection: 'clients', id: String(id), depth: 0 })
  if (!client.email) {
    return Response.json({ message: 'Client has no email address.' }, { status: 400 })
  }

  const token = await req.payload.forgotPassword({
    collection: 'clients',
    data: { email: client.email },
    disableEmail: true,
    req,
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return Response.json({
    url: `${baseUrl}/set-password?token=${token}`,
    expiresInMinutes: 60,
  })
}

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
    defaultColumns: ['name', 'email', 'status', 'lastWorkoutAt'],
    group: 'Accounts',
  },
  access: {
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
    admin: () => false,
  },
  endpoints: [
    {
      path: '/:id/invite',
      method: 'post',
      handler: inviteHandler,
    },
    {
      path: '/:id/export',
      method: 'get',
      handler: exportCsvHandler,
    },
  ],
  hooks: {
    beforeValidate: [validatePassword],
    beforeLogin: [
      ({ user }) => {
        if (user.status === 'archived') {
          throw new APIError('This account has been archived. Contact your coach.', 403)
        }
        return user
      },
    ],
    beforeDelete: [
      // A client with recorded history must be archived, never deleted —
      // deleting would orphan their logs (FKs are ON DELETE SET NULL).
      async ({ id, req }) => {
        const logs = await req.payload.count({
          collection: 'workout-logs',
          where: { client: { equals: id } },
        })
        if (logs.totalDocs > 0) {
          throw new APIError(
            'Cannot delete a client with recorded workouts. Set their status to "Archived" instead.',
            400,
          )
        }
      },
    ],
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
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'active',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      access: {
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
        description: 'Archived clients cannot log in. Their history is preserved.',
      },
    },
    {
      name: 'profile',
      type: 'group',
      label: 'Profile',
      admin: { description: 'Collected by the first-login onboarding; editable by the client.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'gender',
              type: 'select',
              label: 'Gender',
              options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'birthDate',
              type: 'date',
              label: 'Birthday',
              admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } },
            },
            {
              name: 'heightCm',
              type: 'number',
              label: 'Height (cm)',
              min: 100,
              max: 250,
              admin: { width: '33%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'goal',
              type: 'select',
              label: 'Top goal',
              options: [
                { label: 'Build muscle', value: 'build_muscle' },
                { label: 'Gain strength', value: 'gain_strength' },
                { label: 'Fat loss', value: 'fat_loss' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'experience',
              type: 'select',
              label: 'Experience',
              options: [
                { label: 'Beginner (0–1y)', value: 'beginner' },
                { label: 'Intermediate (1–3y)', value: 'intermediate' },
                { label: 'Advanced (3y+)', value: 'advanced' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'onboardedAt',
      type: 'date',
      label: 'Onboarded at',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set when the client completes the first-login questions.',
      },
    },
    {
      name: 'dailyKcalTarget',
      type: 'number',
      label: 'Daily kcal target',
      defaultValue: 2000,
      min: 0,
      max: 10000,
      admin: {
        position: 'sidebar',
        description: 'Drives the calorie ring in the client app.',
      },
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'lastWorkoutAt',
      type: 'date',
      label: 'Last workout',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Updated automatically when the client trains.',
      },
    },
    {
      name: 'clientActions',
      type: 'ui',
      label: '',
      admin: {
        components: {
          Field: {
            path: '@/modules/training/admin/client-actions/client-actions',
            exportName: 'ClientActions',
          },
        },
      },
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
