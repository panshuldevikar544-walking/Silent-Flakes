import type { GlobalConfig } from 'payload'
import { anyone, signedIn } from '../lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Website settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: signedIn },
  fields: [
    { name: 'headline', type: 'text', required: true, defaultValue: 'Books that arrive quietly and stay.' },
    {
      name: 'introduction',
      type: 'textarea',
      required: true,
      defaultValue:
        'Silent Flakes is an independent publishing house for its founder’s books and for the writers who join it.',
    },
    { name: 'philosophy', label: 'Publishing philosophy', type: 'textarea' },
    { name: 'contactEmail', type: 'email' },
  ],
}
