import type { Field, TextFieldSingleValidation } from 'payload'

export const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

export const slugField = (from: string): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'Web address. Leave empty to create it automatically.' },
  hooks: {
    beforeValidate: [
      ({ value, data }) => slugify(String(value || data?.[from] || '')) || undefined,
    ],
  },
})

export const webAddress: TextFieldSingleValidation = (value) => {
  if (!value) return 'Enter the web address.'
  try {
    return new URL(value).protocol === 'https:' ? true : 'The address must start with https://'
  } catch {
    return 'Enter a full address that starts with https://'
  }
}

export const hexColour: TextFieldSingleValidation = (value) =>
  !value || /^#[0-9a-fA-F]{6}$/.test(value) ? true : 'Use a colour code such as #1F3A5F'
