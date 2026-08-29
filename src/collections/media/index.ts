import type { CollectionConfig } from 'payload'
import { isAdmin } from '../../access'

/**
 * V1 runs on Vercel with no persistent local filesystem, so file uploads are
 * disabled: creating/updating media is blocked and the collection is hidden
 * from the admin nav. Exercise media stays URL-based (`exercises.videoUrl`).
 * Existing rows (if any) remain readable so nothing breaks.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    hidden: true,
  },
  access: {
    read: () => true,
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  upload: {
    mimeTypes: ['image/*'], // only allow image uploads
  },
}
