import type { CollectionConfig } from 'payload'
import { adminOnly, anyone, signedIn } from '../lib/access'
import { slugField } from '../lib/fields'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: { useAsTitle: 'name', group: 'Catalogue' },
  access: { read: anyone, create: signedIn, update: signedIn, delete: adminOnly },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'portrait', type: 'upload', relationTo: 'media' },
    { name: 'biography', type: 'textarea' },
    { name: 'academicBackground', type: 'textarea' },
    { name: 'professionalBackground', type: 'textarea' },
    { name: 'writingInterests', type: 'textarea' },
    { name: 'philosophy', label: 'Author philosophy', type: 'textarea' },
  ],
}
