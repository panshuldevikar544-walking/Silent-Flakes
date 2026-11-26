import type { CollectionConfig } from 'payload'
import { adminOnly, anyone, signedIn } from '../lib/access'
import { slugField } from '../lib/fields'

export const Genres: CollectionConfig = {
  slug: 'genres',
  admin: { useAsTitle: 'name', group: 'Catalogue' },
  access: { read: anyone, create: signedIn, update: signedIn, delete: adminOnly },
  fields: [{ name: 'name', type: 'text', required: true }, slugField('name')],
}
