import type { Metadata } from 'next'
import React from 'react'

import { BookCard } from '@/components/BookCard'
import { GenreFilter } from '@/components/GenreFilter'
import { genresOf, getBooks } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Books',
  description: 'Every book published by Silent Flakes.',
  alternates: { canonical: '/books' },
}

export default async function BooksPage() {
  const books = await getBooks()
  const soon = books
    .filter((b) => b.status !== 'available')
    .sort((a, b) => (a.launchDate ?? '9999').localeCompare(b.launchDate ?? '9999'))
  const out = books.filter((b) => b.status === 'available')
  const genres = [...new Set(books.flatMap((b) => genresOf(b).map((g) => g.name)))].sort()

  const groups = [
    { title: 'Coming soon', books: soon },
    { title: 'Out now', books: out },
  ].filter((g) => g.books.length)

  return (
    <section className="library">
      <div className="page-head">
        <p className="eyebrow" data-reveal>
          The list
        </p>
        <h1 data-scatter>Books</h1>
        <p data-reveal>Open any book to step inside its own colours and weather.</p>
        <GenreFilter genres={genres} />
      </div>
      {books.length === 0 && <p className="library-empty">The first book is on its way.</p>}
      {groups.map((group) => (
        <div key={group.title} className="library-group" data-group>
          <h2 className="group-title" data-reveal>
            {group.title}
            <span>{group.books.length}</span>
          </h2>
          <div className="cards" data-reveal="stagger">
            {group.books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
