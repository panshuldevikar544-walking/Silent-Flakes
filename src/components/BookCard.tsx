import React from 'react'

import type { Book } from '@/payload-types'
import { authorNames, formatDate, genresOf, mediaOf, themeOf, themeStyle } from '@/lib/data'

import { BookLink } from './BookLink'

export const statusOf = (book: Book) =>
  book.status === 'available'
    ? 'Available now'
    : book.launchDate
      ? `Coming ${formatDate(book.launchDate)}`
      : 'Coming soon'

/** The cover, or the title set on the book's colour when there is no cover yet. */
export function Cover({ book, className }: { book: Book; className?: string }) {
  const cover = mediaOf(book.cover)?.url
  return cover ? (
    // The title is always written beside the cover, so the picture needs no description.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={cover} alt="" data-cover />
  ) : (
    <span className={className ? `${className} cover-placeholder` : 'cover-placeholder'} aria-hidden>
      <span>{book.title}</span>
      <svg viewBox="0 0 24 24" width="22" height="22">
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
          {[0, 60, 120].map((turn) => (
            <path key={turn} transform={`rotate(${turn} 12 12)`} d="M12 3v18M9.5 5l2.5 2 2.5-2M9.5 19l2.5-2 2.5 2" />
          ))}
        </g>
      </svg>
    </span>
  )
}

/** A book as a portrait card in its own colours. Opening it plays the colour-wipe show. */
export function BookCard({ book }: { book: Book }) {
  const theme = themeOf(book)
  const genres = genresOf(book)

  return (
    <BookLink
      href={`/books/${book.slug}`}
      colour={theme.cover}
      className="book-card"
      data-genres={genres.map((g) => g.name).join('|')}
    >
      <div className="book-card-inner" style={themeStyle(book)}>
        <div className="book-card-cover">
          <Cover book={book} />
        </div>
        <div className="book-card-text">
          {genres.length > 0 && (
            <span className="chips">
              {book.status !== 'available' && <span className="chip soon">Coming soon</span>}
              {genres.map((g) => (
                <span key={g.id} className="chip">
                  {g.name}
                </span>
              ))}
            </span>
          )}
          <h3 className="book-card-title">{book.title}</h3>
          <p className="book-card-authors">{authorNames(book)}</p>
          <p className="book-card-intro">{book.introduction}</p>
          <div className="book-card-foot">
            <span>{statusOf(book)}</span>
            <span className="book-card-open" aria-hidden>
              Open
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </BookLink>
  )
}
