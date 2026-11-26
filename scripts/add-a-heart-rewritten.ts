// One-off: adds the first real book, using the text from its Notion Press, Amazon and
// Flipkart listings (checked 26 November 2026), and hides the sample books as drafts.
// Run with:  npm run payload -- run scripts/add-a-heart-rewritten.ts
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const title = 'A Heart Rewritten'
const existing = await payload.count({ collection: 'books', where: { title: { equals: title } } })
if (existing.totalDocs > 0) {
  console.log('Already added, nothing to do.')
  process.exit(0)
}

const author = async (name: string, biography: string) =>
  (await payload.create({ collection: 'authors', data: { name, biography } })).id

const prabhat = await author(
  'Prabhat Swain',
  'Born in Lucknow into an Army family, Prabhat’s childhood was shaped by constant change. His school years took him through Meerut, Delhi, Pune and Hyderabad. Moving between cities was only part of the experience; even within the same city, changing houses meant getting used to new neighbourhoods, new surroundings and, sometimes, starting over all over again. Hyderabad, though not a place he remembers in great detail, remains one of the many stops along that journey. He went on to pursue his bachelor’s degree in Pune and later moved to Vellore for his master’s. Over the years, adapting to unfamiliar places and meeting new people became a familiar part of life. Perhaps it also taught him that a sense of belonging has less to do with the place itself and more to do with the people and memories we build there. Today, Prabhat works as a Design Manager in Bengaluru. Away from work, he enjoys tinkering with gadgets, gaming and drawing—pursuits that let him explore his curiosity and creative side.',
)
const krishan = await author(
  'Krishan Pandey',
  'Born in Pune to a family rooted in Varanasi, Krishan’s childhood was shaped by constant travel. His school years took him through several cities, and each move brought a new classroom, new friends and a new place to call home. Growing up between his roots and wherever the road led next, he learned early to carry home with him. He completed his bachelor’s degree in engineering in Pune, where he met Prabhat. What began as a friendship between classmates grew, years later, into a shared story. Life on the move had taught him to notice people, places and the small moments that stay with us long after we’ve moved on. Today, Krishan is pursuing his PhD at VNIT Nagpur. Away from his research, he loves reading and exploring ancient sites—places where history and stories meet, and which may well inspire his next book.',
)

const genre = (await payload.create({ collection: 'genres', data: { name: 'Literature & Fiction' } }))
  .id

const samples = await payload.update({
  collection: 'books',
  where: { title: { like: 'Sample Book' } },
  data: { visibility: 'draft', featured: false },
})

const amazon = 'https://www.amazon.in/dp/'
const flipkart = 'https://www.flipkart.com/a-heart-rewritten/p/itm7aace0102dbc9?pid='
const notion = 'https://notionpress.com/in/read/a-heart-rewritten'

await payload.create({
  collection: 'books',
  data: {
    title,
    subtitle: 'It is easier to count a room than to walk into it',
    author: prabhat,
    coAuthors: [krishan],
    genres: [genre],
    introduction:
      'A warm, funny, quietly aching novel about first love, second chances, and finding out that home was never a place.',
    about:
      'Some people leave. Arjun Sharma leaves first. Nine cities, one Army childhood, and a box marked MISC that he has carried through every move and never opened. Inside it is the girl he loved at fifteen in a school garden in Allahabad, and the silence that ended it. Now he is twenty-three and new to Pune, where Pratyusha Arora asks for what she wants and doesn’t go anywhere. To stay with her, Arjun will have to open the box and face the girl he walked away from.\n\nA Heart Rewritten, their first novel co-written over 4 years, explores love, friendship, memories, and the ways life gives us opportunities to understand ourselves a little better.',
    visibility: 'published',
    status: 'available',
    featured: true,
    coverColour: '#8E2A22',
    binding: 'paperback',
    publicationDate: '2026-11-15T12:00:00.000Z',
    isbn: '9798908569118',
    publisher: 'Notion Press',
    language: 'English',
    pageCount: 240,
    format: 'Paperback (240 pages); hardcover (228 pages, ISBN 9798908569125)',
    price: 'Paperback ₹330, hardcover ₹490 (list price; stores may differ)',
    buyLinks: [
      { store: 'Amazon', format: 'Paperback', url: `${amazon}B0HRS19HJV` },
      { store: 'Amazon', format: 'Hardcover', url: `${amazon}B0HRS8QWMR` },
      { store: 'Flipkart', format: 'Paperback', url: `${flipkart}9798908569118` },
      { store: 'Flipkart', format: 'Hardcover', url: `${flipkart}9798908569125` },
      { store: 'Notion Press', format: 'Paperback', url: notion },
      { store: 'Notion Press', format: 'Hardcover', url: `${notion}-hardcover/hardcover` },
    ],
  },
})

console.log(`Added ${title}. Sample books set to draft: ${samples.docs.length}.`)
process.exit(0)
