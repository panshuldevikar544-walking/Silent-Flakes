import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { textOn } from '@/lib/colour'
import { authorNames, formatDate, getBooks, mediaOf } from '@/lib/data'

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
        // With a single book, the card is shown large so the page does not look empty.
        <ul className={books.length === 1 ? 'single' : undefined}>
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
                  <div className="library-entry">
                    <h2>{book.title}</h2>
                    <p>{authorNames(book)}</p>
                    {books.length === 1 && (
                      <>
                        <p className="library-intro">{book.introduction}</p>
                        <p className="library-status">
                          {book.status === 'available'
                            ? 'Available now'
                            : book.launchDate
                              ? `Coming ${formatDate(book.launchDate)}`
                              : 'Coming soon'}
                        </p>
                        <span className="button" aria-hidden>
                          See the book
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
