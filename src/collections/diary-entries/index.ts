import { APIError, type CollectionConfig } from 'payload'
import { adminOrOwnByClient } from '../../access'

const MAX_TEXT_LENGTH = 2000
const MAX_GRAMS = 5000

type IncomingItem = {
  food?: number | { id: number } | null
  name?: string | null
  grams?: number | null
  kcalPer100g?: number | null
}

const relId = (value: number | { id: number } | null | undefined): number | null =>
  value && typeof value === 'object' ? value.id : (value ?? null)

/**
 * Client daily diary: quick entries for meals eaten, activities done, and
 * free notes. Meals can carry food items (food + grams); calories are
 * ALWAYS computed server-side from the food catalog (or the item's manual
 * kcal/100g for custom foods) — client-supplied kcal values are ignored.
 */
export const DiaryEntries: CollectionConfig = {
  slug: 'diary-entries',
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['client', 'entryDate', 'kind', 'totalKcal', 'text'],
    group: 'Training log',
  },
  indexes: [
    {
      fields: ['client', 'entryDate'],
    },
  ],
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: adminOrOwnByClient,
    update: adminOrOwnByClient,
    delete: adminOrOwnByClient,
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.user?.collection === 'clients') {
          data.client = req.user.id
        }

        const items = (data.items ?? []) as IncomingItem[]

        const hasText = typeof data.text === 'string' && data.text.trim().length > 0
        if (!hasText && items.length === 0) {
          throw new APIError('Add some text or at least one food item.', 400)
        }

        // Server-side nutrition math — never trust client-sent kcal.
        let totalKcal = 0
        const resolvedItems = []
        for (const item of items) {
          const grams = Number(item.grams)
          if (!Number.isFinite(grams) || grams <= 0 || grams > MAX_GRAMS) {
            throw new APIError(`Each food item needs a weight between 1 and ${MAX_GRAMS} grams.`, 400)
          }

          const foodId = relId(item.food)
          let name = (item.name ?? '').trim()
          let kcalPer100g = Number(item.kcalPer100g)

          if (foodId) {
            const food = await req.payload.findByID({
              collection: 'foods',
              id: foodId,
              depth: 0,
              req,
            })
            name = food.name
            kcalPer100g = food.kcalPer100g
          } else {
            if (!name) throw new APIError('Custom food items need a name.', 400)
            if (!Number.isFinite(kcalPer100g) || kcalPer100g < 0 || kcalPer100g > 900) {
              throw new APIError('Custom food items need kcal per 100 g (0–900).', 400)
            }
          }

          const kcal = Math.round((grams * kcalPer100g) / 100)
          totalKcal += kcal
          resolvedItems.push({
            food: foodId,
            name,
            grams: Math.round(grams),
            kcalPer100g,
            kcal,
          })
        }
        data.items = resolvedItems
        data.totalKcal = resolvedItems.length ? totalKcal : null
        return data
      },
    ],
  },
  fields: [
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Client',
      index: true,
      defaultValue: ({ user }) => (user?.collection === 'clients' ? user.id : undefined),
    },
    {
      name: 'entryDate',
      type: 'date',
      required: true,
      label: 'Date',
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'meal',
      label: 'Type',
      options: [
        { label: 'Meal', value: 'meal' },
        { label: 'Activity', value: 'activity' },
        { label: 'Note', value: 'note' },
      ],
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Entry',
      maxLength: MAX_TEXT_LENGTH,
    },
    {
      name: 'items',
      type: 'array',
      label: 'Food items',
      labels: { singular: 'Food item', plural: 'Food items' },
      admin: {
        description: 'Foods with weight in grams. Calories are computed automatically.',
      },
      fields: [
        {
          name: 'food',
          type: 'relationship',
          relationTo: 'foods',
          label: 'Food (catalog)',
        },
        { name: 'name', type: 'text', label: 'Name (snapshot / custom)' },
        { name: 'grams', type: 'number', required: true, min: 1, max: MAX_GRAMS, label: 'Grams' },
        {
          name: 'kcalPer100g',
          type: 'number',
          label: 'kcal / 100 g (snapshot)',
          admin: { readOnly: true },
        },
        {
          name: 'kcal',
          type: 'number',
          label: 'kcal (computed)',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'totalKcal',
      type: 'number',
      label: 'Total kcal (computed)',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
