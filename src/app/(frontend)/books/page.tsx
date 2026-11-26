import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { textOn } from '@/lib/colour'
import { authorNames, getBooks, mediaOf } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Books',
  description: 'Every book published by Silent Flakes.',
  alternates: { canonical: '/books' },
}

export default async function BooksPage() {
  const books = await getBooks()

  return (
    <section className="library">
      <h1>Books</h1>
      {books.length === 0 ? (
        <p>The first book is on its way.</p>
      ) : (
        <ul>
          {books.map((book) => {
            const cover = mediaOf(book.cover)?.url
            const colour = book.coverColour || '#24405C'
            return (
              <li key={book.id}>
                <Link href={`/books/${book.slug}`}>
                  {cover ? (
                    // The title is written below, so the picture needs no description.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="library-cover" src={cover} alt="" />
                  ) : (
                    <span className="library-cover" style={{ background: colour, color: textOn(colour) }} aria-hidden>
                      {book.title}
                    </span>
                  )}
                  <h2>{book.title}</h2>
                  <p>{authorNames(book)}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
