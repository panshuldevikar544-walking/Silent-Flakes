import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import type { Author, Book } from '@/payload-types'
import { authorsOf, getBooks, getSettings } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The house',
  alternates: { canonical: '/house' },
}

export default async function HousePage() {
  const [settings, books] = await Promise.all([getSettings(), getBooks()])

  // The writers of the published books, each with the books they wrote here.
  const writers = new Map<number, { author: Author; books: Book[] }>()
  for (const book of books) {
    for (const author of authorsOf(book)) {
      const entry = writers.get(author.id) ?? { author, books: [] }
      entry.books.push(book)
      writers.set(author.id, entry)
    }
  }

  return (
    <>
      <section className="house house-page">
        <h1>The house</h1>
        <p>{settings.introduction}</p>
        {settings.philosophy && <p>{settings.philosophy}</p>}
        {settings.contactEmail && (
          <p>
            Write to us: <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
          </p>
        )}
      </section>

      {writers.size > 0 && (
        <section className="writers">
          <h2>Our writers</h2>
          <ul>
            {[...writers.values()].map(({ author, books: written }) => (
              <li key={author.id}>
                <h3>{author.name}</h3>
                <p>
                  {written.map((book, i) => (
                    <React.Fragment key={book.id}>
                      {i > 0 && ', '}
                      <Link href={`/books/${book.slug}`}>{book.title}</Link>
                    </React.Fragment>
                  ))}
                </p>
              </li>
            ))}
          </ul>
          <p>
            <Link href="/books">See all our books</Link>
          </p>
        </section>
      )}
    </>
  )
}
