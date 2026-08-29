import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, isAuthenticated } from '../../access'
import { DEFAULT_TRACKING, TRACKING_OPTIONS } from '@/modules/training/exercises'

export const Exercises: CollectionConfig = {
  slug: 'exercises',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'muscleGroup', 'equipment', 'archived'],
    group: 'Catalog',
  },
  access: {
    create: isAdmin,
    read: isAuthenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeDelete: [
      // An exercise referenced by plans or logs must be archived, not deleted —
      // deleting would NULL those references and break history.
      async ({ id, req }) => {
        const [logs, rows] = await Promise.all([
          req.payload.count({ collection: 'set-logs', where: { exercise: { equals: id } } }),
          req.payload.count({
            collection: 'workout-exercise-rows',
            where: { exercise: { equals: id } },
          }),
        ])
        if (logs.totalDocs > 0 || rows.totalDocs > 0) {
          throw new APIError(
            'Cannot delete an exercise that is used in plans or logged sets. Mark it as archived instead.',
            400,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'archived',
      type: 'checkbox',
      label: 'Archived',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Archived exercises are hidden when building new workouts.',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name',
    },
    {
      name: 'trackingType',
      type: 'select',
      label: 'Tracking type',
      defaultValue: DEFAULT_TRACKING,
      options: TRACKING_OPTIONS,
      admin: { description: 'Determines which fields are shown in the set logging form' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Technical description',
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video (link)',
      admin: { description: 'URL to instructional video (e.g. YouTube)' },
    },
    {
      name: 'muscleGroup',
      type: 'text',
      label: 'Muscle group',
    },
    {
      name: 'equipment',
      type: 'text',
      label: 'Equipment',
    },
  ],
}
