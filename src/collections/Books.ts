import type { CollectionConfig } from 'payload'
import { adminOnly, signedIn } from '../lib/access'
import { hexColour, slugField, webAddress } from '../lib/fields'

export const Books: CollectionConfig = {
  slug: 'books',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'visibility'],
    group: 'Catalogue',
  },
  access: {
    // Visitors only ever receive published books.
    read: ({ req }) => (req.user ? true : { visibility: { equals: 'published' } }),
    create: signedIn,
    update: signedIn,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      admin: { position: 'sidebar', description: 'Only published books appear on the website.' },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'status',
      label: 'Publication status',
      type: 'select',
      required: true,
      defaultValue: 'coming-soon',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Coming soon', value: 'coming-soon' },
        { label: 'Available now', value: 'available' },
      ],
    },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar' } },
    slugField('title'),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Book',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'subtitle', type: 'text' },
            { name: 'author', type: 'relationship', relationTo: 'authors', required: true },
            {
              name: 'coAuthors',
              label: 'Co-authors',
              type: 'relationship',
              relationTo: 'authors',
              hasMany: true,
              admin: { description: 'Anyone who wrote the book with the author above.' },
            },
            { name: 'genres', type: 'relationship', relationTo: 'genres', hasMany: true },
            { name: 'introduction', label: 'Short introduction', type: 'textarea', required: true },
          ],
        },
        {
          label: 'Design',
          fields: [
            { name: 'cover', label: 'Front cover image', type: 'upload', relationTo: 'media' },
            { name: 'backCover', label: 'Back cover image', type: 'upload', relationTo: 'media' },
            {
              name: 'coverColour',
              label: 'Main cover colour',
              type: 'text',
              defaultValue: '#24405C',
              validate: hexColour,
              admin: { description: 'Colours the spine and this book’s page. Example: #24405C' },
            },
            {
              name: 'pageColour',
              label: 'Page background colour',
              type: 'text',
              validate: hexColour,
              admin: {
                description:
                  'The light colour behind this book’s page, taken from the cover (for example its paper tone). Leave empty for a soft tint of the cover colour.',
              },
            },
            {
              name: 'accentColour',
              label: 'Accent colour',
              type: 'text',
              validate: hexColour,
              admin: {
                description: 'A second cover colour, used for highlights and the genre labels. Leave empty to use the cover colour.',
              },
            },
            {
              name: 'motif',
              label: 'Falling around the book',
              type: 'select',
              defaultValue: 'none',
              options: [
                { label: 'Nothing', value: 'none' },
                { label: 'Autumn leaves', value: 'leaves' },
                { label: 'Snow', value: 'snow' },
              ],
              admin: { description: 'What drifts around the 3D book on this book’s page, to match its story.' },
            },
            {
              name: 'binding',
              type: 'select',
              required: true,
              defaultValue: 'paperback',
              options: [
                { label: 'Paperback', value: 'paperback' },
                { label: 'Hardcover', value: 'hardcover' },
              ],
            },
          ],
        },
        {
          label: 'Story',
          description: 'Sections left empty are hidden on the website.',
          fields: [
            { name: 'about', label: 'What the book is about', type: 'textarea' },
            { name: 'inspiration', type: 'textarea' },
            { name: 'readersCanExpect', label: 'What readers can expect', type: 'textarea' },
            { name: 'audience', label: 'Who should read it', type: 'textarea' },
            { name: 'topics', type: 'array', fields: [{ name: 'topic', type: 'text', required: true }] },
            {
              name: 'highlights',
              label: 'What makes this book special',
              type: 'array',
              fields: [
                { name: 'heading', type: 'text', required: true },
                { name: 'text', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            { name: 'publicationDate', type: 'date' },
            {
              name: 'launchDate',
              type: 'date',
              admin: { description: 'Shows a countdown while the book is coming soon.' },
            },
            { name: 'announcement', label: 'Launch announcement', type: 'textarea' },
            { name: 'isbn', label: 'ISBN', type: 'text' },
            { name: 'publisher', type: 'text', defaultValue: 'Silent Flakes' },
            { name: 'language', type: 'text' },
            { name: 'pageCount', label: 'Number of pages', type: 'number', min: 1 },
            { name: 'format', type: 'text' },
            { name: 'dimensions', type: 'text' },
            { name: 'edition', type: 'text' },
            { name: 'price', type: 'text' },
          ],
        },
        {
          label: 'Buy and preview',
          fields: [
            {
              name: 'buyLinks',
              type: 'array',
              fields: [
                {
                  name: 'store',
                  type: 'text',
                  required: true,
                  admin: { description: 'Amazon, Flipkart…' },
                },
                { name: 'format', type: 'text', admin: { description: 'Optional: Paperback, eBook…' } },
                {
                  name: 'url',
                  label: 'Web address',
                  type: 'text',
                  required: true,
                  validate: webAddress,
                },
              ],
            },
            {
              name: 'contents',
              label: 'Table of contents',
              type: 'array',
              fields: [{ name: 'chapter', type: 'text', required: true }],
            },
            { name: 'sample', label: 'Sample text', type: 'textarea' },
            { name: 'samplePages', type: 'upload', relationTo: 'media', hasMany: true },
          ],
        },
        {
          label: 'Search engines',
          fields: [
            { name: 'seoTitle', type: 'text' },
            { name: 'seoDescription', type: 'textarea', maxLength: 180 },
          ],
        },
      ],
    },
  ],
}
