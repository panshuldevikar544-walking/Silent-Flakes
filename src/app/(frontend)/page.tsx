import Link from 'next/link'
import React from 'react'

import { BookStage } from '@/components/BookStage'
import { authorNames, bookVisual, formatDate, getBooks, getSettings } from '@/lib/data'
import { textOn } from '@/lib/colour'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [books, settings] = await Promise.all([getBooks(), getSettings()])
  const featured = books.find((b) => b.featured) ?? books[0]

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>{settings.headline}</h1>
          <p>{settings.introduction}</p>
          {featured && (
            <div className="hero-featured">
              <Link className="button" href={`/books/${featured.slug}`}>
                Explore {featured.title}
              </Link>
              <span>by {authorNames(featured)}</span>
            </div>
          )}
        </div>
        {featured && <BookStage book={bookVisual(featured)} leaves />}
      </section>

      <section className="catalogue" id="books">
        <h2>Our books</h2>
        {books.length === 0 ? (
          <p>The first book is on its way.</p>
        ) : (
          <ul>
            {books.map((book) => {
              const colour = book.coverColour || '#24405C'
              return (
                <li key={book.id}>
                  <Link href={`/books/${book.slug}`}>
                    <span className="spine" style={{ background: colour, color: textOn(colour) }} aria-hidden>
                      {book.title}
                    </span>
                    <span className="entry">
                      <strong>{book.title}</strong>
                      <span>{authorNames(book)}</span>
                      <span className="entry-intro">{book.introduction}</span>
                      <span className="entry-status">
                        {book.status === 'available'
                          ? 'Available now'
                          : book.launchDate
                            ? `Coming ${formatDate(book.launchDate)}`
                            : 'Coming soon'}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="house" id="house">
        <h2>The house</h2>
        {/* The introduction is already in the hero, so it is not repeated here. */}
        {settings.philosophy && <p>{settings.philosophy}</p>}
        <p>
          <Link href="/house">More about the house</Link>
        </p>
        {settings.contactEmail && (
          <p>
            Write to us: <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
          </p>
        )}
      </section>
    </>
  )
}
