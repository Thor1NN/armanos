import type { CollectionConfig } from 'payload'
import { isAdmin } from '../../access'

export const ShareLinks: CollectionConfig = {
  slug: 'share-links',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'plan', 'permissions', 'expiresAt', 'active'],
    group: 'Sharing',
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.token) {
          data.token = crypto.randomUUID()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      admin: { description: 'Optional name to identify this link' },
    },
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'plans',
      required: true,
      label: 'Plan',
      admin: { position: 'sidebar' },
    },
    {
      name: 'token',
      type: 'text',
      unique: true,
      index: true,
      label: 'Share token',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Auto-generated on first save',
      },
    },
    {
      name: 'permissions',
      type: 'select',
      hasMany: true,
      required: true,
      label: 'What to share',
      defaultValue: ['plan'],
      options: [
        { label: 'Plan preview', value: 'plan' },
        { label: 'Results / logs', value: 'results' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      label: 'Expires at',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Link stops working after this date',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
      admin: { position: 'sidebar' },
    },
    {
      name: 'shareUrl',
      type: 'ui',
      label: 'Share URL',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/modules/sharing/admin/share-link-url/share-link-url',
            exportName: 'ShareLinkUrl',
          },
        },
      },
    },
  ],
}
