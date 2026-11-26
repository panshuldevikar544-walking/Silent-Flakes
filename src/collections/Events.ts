import type { CollectionConfig } from 'payload'
import { adminOnly, signedIn } from '../lib/access'

// Anonymous counts only: no cookies, addresses or visitor identifiers.
export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Buy click', plural: 'Buy clicks' },
  admin: {
    useAsTitle: 'store',
    defaultColumns: ['store', 'book', 'createdAt'],
    group: 'Analytics',
    description: 'Clicks on buy buttons. A click is not a confirmed sale.',
  },
  access: { read: signedIn, create: () => false, update: () => false, delete: adminOnly },
  fields: [
    { name: 'book', type: 'relationship', relationTo: 'books', required: true },
    { name: 'store', type: 'text', required: true },
  ],
}
