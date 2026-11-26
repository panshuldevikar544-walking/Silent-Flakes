// Uploads a front cover image and attaches it to a book.
// Run with:  npm run payload -- run scripts/attach-cover.ts   (set BOOK_SLUG and COVER_FILE)
import config from '@payload-config'
import { getPayload } from 'payload'

const { BOOK_SLUG, COVER_FILE } = process.env
if (!BOOK_SLUG || !COVER_FILE) throw new Error('Set BOOK_SLUG and COVER_FILE.')

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'books',
  where: { slug: { equals: BOOK_SLUG } },
  limit: 1,
})
if (!docs[0]) throw new Error(`No book with slug ${BOOK_SLUG}.`)

const cover = await payload.create({
  collection: 'media',
  data: { alt: `Front cover of ${docs[0].title}` },
  filePath: COVER_FILE,
})
await payload.update({ collection: 'books', id: docs[0].id, data: { cover: cover.id } })

console.log(`Attached the cover to ${docs[0].title}.`)
process.exit(0)
