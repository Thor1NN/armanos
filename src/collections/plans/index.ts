import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, adminOrOwnByClient } from '../../access'
import { duplicatePlanHandler } from './duplicate'

export const Plans: CollectionConfig = {
  slug: 'plans',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'status', 'updatedAt'],
    group: 'Training plan',
  },
  access: {
    create: isAdmin,
    read: adminOrOwnByClient,
    update: isAdmin,
    delete: isAdmin,
  },
  endpoints: [
    {
      path: '/:id/duplicate',
      method: 'post',
      handler: duplicatePlanHandler,
    },
  ],
  hooks: {
    beforeDelete: [
      // Deleting a plan would orphan its microcycles/workouts (FKs are
      // ON DELETE SET NULL) and silently bypass the workout-level log
      // protection — block it whenever any session was logged under it.
      async ({ id, req }) => {
        const microcycles = await req.payload.find({
          collection: 'microcycles',
          where: { plan: { equals: id } },
          depth: 0,
          limit: 1000,
          pagination: false,
        })
        const microcycleIds = microcycles.docs.map((doc) => doc.id)
        if (!microcycleIds.length) return
        const workouts = await req.payload.find({
          collection: 'workouts',
          where: { microcycle: { in: microcycleIds } },
          depth: 0,
          limit: 10000,
          pagination: false,
        })
        const workoutIds = workouts.docs.map((doc) => doc.id)
        if (!workoutIds.length) return
        const logs = await req.payload.count({
          collection: 'workout-logs',
          where: { workout: { in: workoutIds } },
        })
        if (logs.totalDocs > 0) {
          throw new APIError(
            'Cannot delete a plan that already has logged sessions. Set its status to "Completed" instead.',
            400,
          )
        }
      },
    ],
  },
  // Keep an audit trail of every change (no drafts — publish workflow unchanged).
  versions: true,
  fields: [
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Client (plan owner)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'active',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Start date',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'End date',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Plan name',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'source',
      type: 'text',
      label: 'Source (file)',
      admin: { description: 'Where the plan was imported from' },
    },
    {
      name: 'planActions',
      type: 'ui',
      label: '',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/modules/training/admin/plan-actions/plan-actions',
            exportName: 'DuplicatePlan',
          },
        },
      },
    },
    {
      name: 'microcyclesNavigation',
      type: 'ui',
      label: '',
      admin: {
        components: {
          Field: {
            path: '@/modules/training/admin/training-navigation/training-navigation',
            exportName: 'PlanMicrocycles',
          },
        },
      },
    },
  ],
}
