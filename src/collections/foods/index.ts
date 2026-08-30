import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, isAuthenticated } from '../../access'

const nonNegative = (value: number | null | undefined): true | string => {
  if (value === null || value === undefined) return true
  if (!Number.isFinite(value) || value < 0) return 'Must be a non-negative number.'
  return true
}

/**
 * Food catalog for the client diary: per-100g nutrition values maintained by
 * the coach. Clients read it to compose meals; calories are always computed
 * server-side from these values (see diary-entries).
 */
export const Foods: CollectionConfig = {
  slug: 'foods',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kcalPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g', 'archived'],
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
      // Referenced foods must be archived, not deleted — meal items keep a
      // snapshot, but the reference should not silently disappear.
      async ({ id, req }) => {
        const used = await req.payload.count({
          collection: 'diary-entries',
          where: { 'items.food': { equals: id } },
        })
        if (used.totalDocs > 0) {
          throw new APIError(
            'Cannot delete a food that is used in diary entries. Mark it as archived instead.',
            400,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Name',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'kcalPer100g',
          type: 'number',
          required: true,
          label: 'kcal / 100 g',
          validate: nonNegative,
          admin: { width: '25%' },
        },
        {
          name: 'proteinPer100g',
          type: 'number',
          label: 'Protein g / 100 g',
          validate: nonNegative,
          admin: { width: '25%' },
        },
        {
          name: 'carbsPer100g',
          type: 'number',
          label: 'Carbs g / 100 g',
          validate: nonNegative,
          admin: { width: '25%' },
        },
        {
          name: 'fatPer100g',
          type: 'number',
          label: 'Fat g / 100 g',
          validate: nonNegative,
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      label: 'Archived',
      admin: {
        position: 'sidebar',
        description: 'Archived foods are hidden from the client food search.',
      },
    },
  ],
}
