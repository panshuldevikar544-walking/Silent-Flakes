import type { CollectionConfig } from 'payload'
import { adminOnly, anyone, signedIn } from '../lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Catalogue' },
  access: { read: anyone, create: signedIn, update: signedIn, delete: adminOnly },
  fields: [{ name: 'alt', label: 'Description of the image', type: 'text', required: true }],
  upload: {
    // Raster formats only: an uploaded SVG can carry scripts.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
}
