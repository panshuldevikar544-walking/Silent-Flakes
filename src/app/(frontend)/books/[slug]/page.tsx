import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { BookEntrance, BookLink } from '@/components/BookLink'
import { BookStage } from '@/components/BookStage'
import { Countdown } from '@/components/Countdown'
import {
  authorNames,
  authorsOf,
  bookVisual,
  formatDate,
  genresOf,
  getBook,
  getBooks,
  mediaOf,
  motifOf,
  themeOf,
  themeStyle,
} from '@/lib/data'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

const load = async ({ params }: Props) => getBook(decodeURIComponent((await params).slug))

export async function generateMetadata(props: Props): Promise<Metadata> {
  const book = await load(props)
  if (!book) return {}
  const title = book.seoTitle || book.title
  const description = book.seoDescription || book.introduction.slice(0, 180)
  const image = mediaOf(book.cover)?.url
  return {
    title,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: { title, description, images: image ? [image] : undefined },
  }
}

function Section({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={className ? `chapter ${className}` : 'chapter'}>
      <h2 data-split>{title}</h2>
      <div data-reveal>{children}</div>
    </section>
  )
}

export default async function BookPage(props: Props) {
  const book = await load(props)
  if (!book) notFound()

  const authors = authorsOf(book)
  const names = authorNames(book)
  const genres = genresOf(book)
  const available = book.status === 'available'
  const links = book.buyLinks ?? []
  const byStore = new Map<string, typeof links>()
  for (const link of links) byStore.set(link.store, [...(byStore.get(link.store) ?? []), link])
  const stores = [...byStore.entries()]
  const hasPreview = Boolean(book.contents?.length || book.sample || book.samplePages?.length)
  const others = (await getBooks()).filter((b) => b.id !== book.id)
  const authorIds = new Set(authors.map((a) => a.id))
  const byAuthor = others.filter((b) => authorsOf(b).some((a) => authorIds.has(a.id)))
  const related = (byAuthor.length ? byAuthor : others).slice(0, 3)

  const specifications = [
    ['ISBN', book.isbn],
    ['Publisher', book.publisher],
    ['Publication date', formatDate(book.publicationDate)],
    ['Language', book.language],
    ['Pages', book.pageCount],
    ['Format', book.format],
    ['Dimensions', book.dimensions],
    ['Edition', book.edition],
    ['Genre', genres.map((g) => g.name).join(', ')],
    ['Price', book.price],
  ].filter(([, value]) => value)

  const aboutParts = [
    ['', book.about],
    ['What inspired it', book.inspiration],
    ['What you can expect', book.readersCanExpect],
  ].filter(([, text]) => text)

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: authors.map((a) => ({ '@type': 'Person', name: a.name })),
    isbn: book.isbn || undefined,
    inLanguage: book.language || undefined,
    numberOfPages: book.pageCount || undefined,
    description: book.introduction,
  }

  return (
    <article className="book-page" style={themeStyle(book)}>
      <BookEntrance />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }}
      />

      <header className="book-hero">
        <div className="book-heading">
          {genres.length > 0 && (
            <p className="chips">
              {genres.map((g) => (
                <span key={g.id} className="chip">
                  {g.name}
                </span>
              ))}
            </p>
          )}
          <h1 data-scatter data-delay="0.9">
            {book.title}
          </h1>
          {book.subtitle && <p className="subtitle">{book.subtitle}</p>}
          <p className="byline">by {names}</p>
          <p className="intro">{book.introduction}</p>
          <p className="status">
            {available
              ? `Available now${book.publicationDate ? `, published ${formatDate(book.publicationDate)}` : ''}`
              : book.launchDate
                ? `Coming ${formatDate(book.launchDate)}`
                : 'Coming soon'}
          </p>
          {!available && book.launchDate && <Countdown date={book.launchDate} />}
          <div className="actions">
            {links.length > 0 && (
              <a className="button accent" href="#buy">
                {available ? 'Buy now' : 'Pre-order'}
              </a>
            )}
            {hasPreview && (
              <a className="button quiet" href="#inside">
                Preview book
              </a>
            )}
          </div>
        </div>
        <BookStage key={book.id} book={bookVisual(book)} motif={motifOf(book)} />
      </header>

      {book.announcement && !available && <p className="announcement">{book.announcement}</p>}

      <div className="chapters">
        {Boolean(aboutParts.length || book.audience || book.topics?.length) && (
          <Section title="About the book">
            {aboutParts.map(([heading, text]) => (
              <React.Fragment key={heading}>
                {heading && <h3>{heading}</h3>}
                <p className="prose">{text}</p>
              </React.Fragment>
            ))}
            {Boolean(book.topics?.length) && (
              <>
                <h3>Topics covered</h3>
                <ul>
                  {book.topics!.map((t) => (
                    <li key={t.id}>{t.topic}</li>
                  ))}
                </ul>
              </>
            )}
            {book.audience && (
              <>
                <h3>Who should read it</h3>
                <p className="prose">{book.audience}</p>
              </>
            )}
          </Section>
        )}

        {Boolean(book.highlights?.length) && (
          <Section title="What makes it special">
            {book.highlights!.map((h) => (
              <React.Fragment key={h.id}>
                <h3>{h.heading}</h3>
                <p className="prose">{h.text}</p>
              </React.Fragment>
            ))}
          </Section>
        )}

        {authors.length > 0 && (
          <Section title={authors.length > 1 ? 'About the authors' : 'About the author'}>
            {authors.map((author) => {
              const portrait = mediaOf(author.portrait)
              return (
                <React.Fragment key={author.id}>
                  {portrait?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="portrait" src={portrait.url} alt={portrait.alt} />
                  )}
                  <h3>{author.name}</h3>
                  {author.biography && <p className="prose">{author.biography}</p>}
                  {[
                    ['Academic background', author.academicBackground],
                    ['Professional background', author.professionalBackground],
                    ['Writing interests', author.writingInterests],
                    ['Philosophy', author.philosophy],
                  ]
                    .filter(([, text]) => text)
                    .map(([heading, text]) => (
                      <React.Fragment key={heading}>
                        <h4>{heading}</h4>
                        <p className="prose">{text}</p>
                      </React.Fragment>
                    ))}
                </React.Fragment>
              )
            })}
          </Section>
        )}

        {hasPreview && (
          <div id="inside">
            <Section title="Inside the book">
              {Boolean(book.contents?.length) && (
                <>
                  <h3>Contents</h3>
                  <ol>
                    {book.contents!.map((c) => (
                      <li key={c.id}>{c.chapter}</li>
                    ))}
                  </ol>
                </>
              )}
              {book.sample && (
                <>
                  <h3>Sample</h3>
                  <p className="prose sample">{book.sample}</p>
                </>
              )}
              {book.samplePages?.map((value) => {
                const page = mediaOf(value)
                return page?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={page.id} src={page.url} alt={page.alt} loading="lazy" />
                ) : null
              })}
            </Section>
          </div>
        )}

        {specifications.length > 0 && (
          <Section title="Details">
            <dl className="specs">
              {specifications.map(([label, value]) => (
                <div key={String(label)}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        <div id="buy">
          <Section className="buy" title={available ? 'Where to buy' : 'Availability'}>
            {links.length === 0 ? (
              <p>Store links will appear here when the book goes on sale.</p>
            ) : (
              <>
                {/* One row per store, with a button for each format it sells. */}
                <ul className="stores">
                  {stores.map(([store, storeLinks]) => (
                    <li key={store}>
                      <h3>{store}</h3>
                      <div>
                        {storeLinks.map((link) => (
                          // Plain link: prefetching would be counted as a click.
                          <a
                            key={link.id}
                            className="button"
                            href={`/go/${encodeURIComponent(book.slug!)}/${link.id}`}
                            target="_blank"
                            rel="noopener nofollow"
                          >
                            {link.format ? (
                              <>
                                <span className="visually-hidden">Buy on {store}, </span>
                                {link.format}
                              </>
                            ) : (
                              `Buy on ${store}`
                            )}
                          </a>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
                {book.price && <p className="note">{book.price}</p>}
                <p className="note">
                  Stores open in a new tab. Payment happens on the store’s own website.
                </p>
              </>
            )}
          </Section>
        </div>

        {related.length > 0 && (
          <Section title={byAuthor.length ? `More by ${names}` : 'More from Silent Flakes'}>
            <ul className="related">
              {related.map((b) => (
                <li key={b.id}>
                  <BookLink href={`/books/${b.slug}`} colour={themeOf(b).cover}>
                    <span style={{ background: themeOf(b).cover }} aria-hidden />
                    {b.title}
                  </BookLink>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </article>
  )
}
