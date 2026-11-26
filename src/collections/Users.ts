import type { Access, CollectionConfig } from 'payload'
import { adminField, adminOnly } from '../lib/access'

const adminOrSelf: Access = ({ req }) =>
  req.user?.role === 'admin' ? true : { id: { equals: req.user?.id ?? 0 } }

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', group: 'Settings' },
  auth: { maxLoginAttempts: 5, lockTime: 10 * 60 * 1000 },
  access: { create: adminOnly, delete: adminOnly, read: adminOrSelf, update: adminOrSelf },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      saveToJWT: true,
      admin: { description: 'The very first account is always made an administrator.' },
      access: { update: adminField },
    },
  ],
  hooks: {
    beforeChange: [
      // The very first account owns the site.
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        return totalDocs === 0 ? { ...data, role: 'admin' } : data
      },
    ],
  },
}
