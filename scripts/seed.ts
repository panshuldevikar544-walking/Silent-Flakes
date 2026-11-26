// Adds clearly marked placeholder content to an empty database.
// Run with:  npm run seed
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const { totalDocs } = await payload.count({ collection: 'books' })
if (totalDocs > 0) {
  console.log('Books already exist, nothing to do.')
  process.exit(0)
}

const author = await payload.create({
  collection: 'authors',
  data: {
    name: 'Sample Author',
    biography: 'Placeholder biography. The real author’s story goes here.',
    writingInterests: 'Placeholder writing interests.',
  },
})

const genre = async (name: string) =>
  (await payload.create({ collection: 'genres', data: { name } })).id

const [fiction, ideas] = [await genre('Fiction'), await genre('Ideas')]

const stores = [
  { store: 'Amazon', url: 'https://example.com/amazon-placeholder' },
  { store: 'Flipkart', url: 'https://example.com/flipkart-placeholder' },
]

const shared = {
  author: author.id,
  visibility: 'published' as const,
  publisher: 'Silent Flakes',
  language: 'English',
  about: 'Placeholder text. A real description of this book replaces it from the dashboard.',
}

await payload.create({
  collection: 'books',
  data: {
    ...shared,
    title: 'Sample Book One',
    subtitle: 'A placeholder until the first real book arrives',
    introduction:
      'This is sample content, here to show how a book looks on the website. It is not a real book.',
    genres: [fiction],
    featured: true,
    status: 'available',
    binding: 'hardcover',
    coverColour: '#1F4B63',
    pageCount: 288,
    publicationDate: '2026-11-01T12:00:00.000Z',
    buyLinks: stores,
    highlights: [{ heading: 'Placeholder highlight', text: 'What sets the real book apart goes here.' }],
    contents: [{ chapter: 'Sample chapter one' }, { chapter: 'Sample chapter two' }],
    sample: 'A short passage from the real book will appear here.',
  },
})

await payload.create({
  collection: 'books',
  data: {
    ...shared,
    title: 'Sample Book Two',
    introduction: 'Sample content showing a book that has not launched yet.',
    genres: [ideas],
    status: 'coming-soon',
    binding: 'paperback',
    coverColour: '#D8A13A',
    pageCount: 176,
    launchDate: '2027-02-14T12:00:00.000Z',
    announcement: 'Placeholder launch announcement.',
  },
})

await payload.create({
  collection: 'books',
  data: {
    ...shared,
    title: 'Sample Book Three',
    introduction: 'A third placeholder, so the shelf has company.',
    genres: [fiction],
    status: 'available',
    binding: 'paperback',
    coverColour: '#7A2E3B',
    pageCount: 408,
    buyLinks: stores.slice(0, 1),
  },
})

console.log('Added a sample author, two genres and three sample books.')
process.exit(0)
