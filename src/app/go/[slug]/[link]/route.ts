import { db, getBook } from '@/lib/data'

export const dynamic = 'force-dynamic'

// The destination always comes from the database, never from the request,
// so this address cannot be used to send people to an arbitrary site.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; link: string }> },
) {
  const { slug, link: linkId } = await params
  const book = await getBook(decodeURIComponent(slug))
  const link = book?.buyLinks?.find((l) => l.id === linkId)
  if (!book || !link) return new Response('This store link is no longer available.', { status: 404 })

  if (request.method === 'GET') {
    try {
      const payload = await db()
      await payload.create({ collection: 'events', data: { book: book.id, store: link.store } })
    } catch (error) {
      // Counting must never stop someone from reaching the store.
      console.error('Could not record buy click', error)
    }
  }

  return new Response(null, {
    status: 302,
    headers: { Location: new URL(link.url).toString(), 'Cache-Control': 'no-store' },
  })
}
