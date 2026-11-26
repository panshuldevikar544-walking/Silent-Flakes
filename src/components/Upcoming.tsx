import React from 'react'

import type { Book } from '@/payload-types'
import { authorNames, formatDate, themeOf, themeStyle } from '@/lib/data'

import { Cover } from './BookCard'
import { BookLink } from './BookLink'
import { Countdown } from './Countdown'

/** The next book to come out, with the time left until it does. */
export function Upcoming({ book }: { book: Book }) {
  const href = `/books/${book.slug}`
  return (
    <section className="upcoming" style={themeStyle(book)} aria-labelledby="upcoming-title">
      <BookLink href={href} colour={themeOf(book).cover} className="upcoming-cover" label={`Open ${book.title}`}>
        <Cover book={book} />
      </BookLink>
      <div className="upcoming-text">
        <p className="eyebrow" data-reveal>
          Coming soon
        </p>
        <h2 id="upcoming-title" data-split>
          {book.title}
        </h2>
        <p className="upcoming-byline" data-reveal>
          by {authorNames(book)}
        </p>
        <p className="upcoming-intro" data-reveal>
          {book.introduction}
        </p>
        {book.launchDate && (
          <div data-reveal>
            <p className="upcoming-date">Out {formatDate(book.launchDate)}</p>
            <Countdown date={book.launchDate} />
          </div>
        )}
        <p data-reveal>
          <BookLink href={href} colour={themeOf(book).cover} className="button">
            See the book
          </BookLink>
        </p>
      </div>
    </section>
  )
}
