import Link from 'next/link'
import React from 'react'

import { BookCard } from '@/components/BookCard'
import { BookCarousel } from '@/components/BookCarousel'
import { BookLink } from '@/components/BookLink'
import { BookStage } from '@/components/BookStage'
import { Flake } from '@/components/Flake'
import { HeroMotion } from '@/components/HeroMotion'
import { IntroMotion } from '@/components/IntroMotion'
import { SnowField } from '@/components/SnowField'
import { Upcoming } from '@/components/Upcoming'
import {
  authorNames,
  bookVisual,
  genresOf,
  getBooks,
  getSettings,
  motifOf,
  themeOf,
} from '@/lib/data'

export const dynamic = 'force-dynamic'

// What a visitor does here, in order. Each line is true of the site as it is.
const steps = [
  {
    title: 'Find a book',
    text: 'Every book we publish sits on one shelf, with its genres marked.',
  },
  {
    title: 'Open it',
    text: 'Each book has its own page: what it is about, who it is for, and a copy to turn in your hands.',
  },
  {
    title: 'Choose a store',
    text: 'Books are sold by the stores linked on each page. Pick the one you like.',
  },
  {
    title: 'Watch for the next',
    text: 'The next book to come out is shown here, with the time left until it does.',
  },
]

const words = ['Independent', 'Read slowly', 'Made to last', 'New voices', 'Small and careful']

export default async function HomePage() {
  const [books, settings] = await Promise.all([getBooks(), getSettings()])
  const out = books.filter((b) => b.status === 'available')
  const soon = books
    .filter((b) => b.status !== 'available')
    .sort((a, b) => (a.launchDate ?? '9999').localeCompare(b.launchDate ?? '9999'))
  const featured = books.find((b) => b.featured) ?? out[0] ?? books[0]
  const genres = [...new Set(books.flatMap((b) => genresOf(b).map((g) => g.name)))].sort()

  return (
    <>
      <IntroMotion />
      <section className="hero" data-hero>
        <div className="hero-sky" aria-hidden>
          <svg className="hero-blobs" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <path
              className="hero-blob blob-a"
              d="M-80 640C80 470 260 560 420 470s180-300 420-290 300 210 470 170 260-200 330-120v700H-80Z"
            />
            <path
              className="hero-blob blob-b"
              d="M-80 760c160-90 300-20 440-90s200-250 400-230 230 190 420 180 230-120 340-80v400H-80Z"
            />
            <path
              className="hero-blob blob-c"
              d="M820 120c120-90 300-80 420 10s210 250 120 380-300 110-420 40-240-60-250-200 10-160 130-230Z"
            />
          </svg>
          <SnowField />
          <div className="hero-mark">
            <Flake />
          </div>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">An independent publishing house</p>
          <h1>{settings.headline}</h1>
          <p className="hero-intro">{settings.introduction}</p>
          {featured && (
            <div className="hero-now">
              <p className="hero-now-label">
                {featured.status === 'available' ? 'Out now' : 'Coming soon'}
              </p>
              <p className="hero-now-title">{featured.title}</p>
              <p className="hero-now-by">by {authorNames(featured)}</p>
              <p className="hero-actions">
                <BookLink
                  className="button"
                  href={`/books/${featured.slug}`}
                  colour={themeOf(featured).cover}
                >
                  Open the book
                </BookLink>
                <Link className="text-link" href="/books">
                  All books
                </Link>
              </p>
            </div>
          )}
        </div>

        {featured && (
          <div className="hero-book">
            <BookStage book={bookVisual(featured)} motif={motifOf(featured)} />
          </div>
        )}
        <HeroMotion />
      </section>

      <section className="showcase" id="books">
        <p className="scribble showcase-scribble" aria-hidden>
          fresh from the press
        </p>
        <h2 className="showcase-title" data-split>
          Our books
        </h2>
        <p className="showcase-sub" data-reveal>
          Every book we publish, side by side. Open one to see it up close.
        </p>
        {books.length === 0 ? (
          <p className="showcase-sub">The first book is on its way.</p>
        ) : (
          <BookCarousel>
            {[...soon, ...out].map((book) => (
              <div key={book.id} className="carousel-item">
                <BookCard book={book} />
              </div>
            ))}
          </BookCarousel>
        )}
      </section>

      <section className="process" aria-labelledby="process-title">
        <div className="process-blob" aria-hidden />
        <div className="process-head">
          <div>
            <h2 id="process-title" data-split>
              How it works
            </h2>
            <p className="scribble process-scribble" aria-hidden>
              from our shelf to yours
            </p>
          </div>
          <div className="process-side" data-reveal>
            <span className="process-flake" aria-hidden>
              <Flake />
            </span>
            <Link className="button" href="/books">
              See the books
            </Link>
          </div>
        </div>
        <ol className="steps">
          {steps.map((step, i) => (
            <li key={step.title} className="step" style={{ '--i': i } as React.CSSProperties}>
              <p className="step-number">Step #{i + 1}</p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {soon[0] && soon[0].id !== featured?.id && <Upcoming book={soon[0]} />}

      {genres.length > 0 && (
        <section className="genres" aria-labelledby="genres-title">
          <p className="genres-kicker" data-reveal>
            Choose from
          </p>
          <h2 id="genres-title" data-split>
            A book for every kind of reader
          </h2>
          <ul className="genre-pills" data-reveal="stagger">
            {genres.map((genre) => (
              <li key={genre}>
                <Link href="/books">{genre}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="ribbon-wrap" aria-hidden>
        <div className="ribbon">
          <p data-marquee>
            {[...words, ...words].map((word, i) => (
              <span key={i}>
                {word}
                <Flake />
              </span>
            ))}
          </p>
        </div>
      </div>

      <section className="house-panel" id="house">
        <svg className="house-badge" viewBox="0 0 200 200" aria-hidden>
          <defs>
            <path id="badge-ring" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
          </defs>
          <text>
            <textPath href="#badge-ring" textLength="462" lengthAdjust="spacing">
              Silent Flakes · independent publishing house ·
            </textPath>
          </text>
        </svg>
        <div data-turn="60" className="house-flake" aria-hidden>
          <Flake />
        </div>
        <p className="eyebrow" data-reveal>
          The house
        </p>
        <h2 data-split>Small, careful, and made to last.</h2>
        {settings.philosophy && <p data-reveal>{settings.philosophy}</p>}
        <p data-reveal>
          <Link className="text-link" href="/house">
            More about the house
          </Link>
        </p>
      </section>
    </>
  )
}
