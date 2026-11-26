import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Author, Book, Genre, Media } from '@/payload-types'

export const db = () => getPayload({ config })

// overrideAccess: false applies the visitor rules, so drafts never leak.
export const getBooks = cache(async (): Promise<Book[]> => {
  const payload = await db()
  const { docs } = await payload.find({
    collection: 'books',
    overrideAccess: false,
    depth: 1,
    limit: 200,
    sort: '-publicationDate',
  })
  return docs
})

export const getBook = cache(async (slug: string): Promise<Book | null> => {
  const payload = await db()
  const { docs } = await payload.find({
    collection: 'books',
    overrideAccess: false,
    depth: 1,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
})

export const getSettings = async () => {
  const payload = await db()
  return payload.findGlobal({ slug: 'site-settings', overrideAccess: false })
}

const populated = <T>(value: number | T | null | undefined): T | null =>
  value && typeof value === 'object' ? value : null

export const authorsOf = (book: Book) =>
  [book.author, ...(book.coAuthors ?? [])]
    .map((a) => populated<Author>(a))
    .filter((a): a is Author => a !== null)
export const authorNames = (book: Book) =>
  authorsOf(book)
    .map((a) => a.name)
    .join(' & ')
export const mediaOf = (value: number | Media | null | undefined) => populated<Media>(value)
export const genresOf = (book: Book) =>
  (book.genres ?? []).map((g) => populated<Genre>(g)).filter((g): g is Genre => g !== null)

export const bookVisual = (book: Book) => ({
  title: book.title,
  author: authorNames(book),
  colour: book.coverColour || '#24405C',
  binding: book.binding,
  pageCount: book.pageCount ?? 240,
  coverUrl: mediaOf(book.cover)?.url ?? null,
  backUrl: mediaOf(book.backCover)?.url ?? null,
})

export type BookVisual = ReturnType<typeof bookVisual>

export const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
    : null
