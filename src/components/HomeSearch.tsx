'use client'

import Link from 'next/link'
import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

export type SearchEntry = {
  kind: 'book' | 'writer'
  title: string
  detail: string
  href: string
  colour: string
  /** Everything the entry can be found by: title, writers, genres. */
  words: string
}

const fold = (text: string) => text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Best first: a title that starts with the query, then a word that does, then anywhere. */
function rank(entry: SearchEntry, terms: string[]) {
  const title = fold(entry.title)
  const words = fold(entry.words)
  if (!terms.every((t) => words.includes(t))) return -1
  const first = terms[0]
  if (title.startsWith(first)) return 3
  if (words.split(/[\s&,]+/).some((w) => w.startsWith(first))) return 2
  return 1
}

/** Search the books and their writers as you type. Press / anywhere to jump to it. */
export function HomeSearch({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const id = useId()

  const results = useMemo(() => {
    const terms = fold(query).trim().split(/\s+/).filter(Boolean)
    if (!terms.length) return []
    return entries
      .map((entry) => ({ entry, score: rank(entry, terms) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
      .slice(0, 6)
      .map((r) => r.entry)
  }, [entries, query])

  // "/" focuses the search from anywhere on the page, unless you are typing elsewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      input.current?.focus()
    }
    const onDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [])

  const showing = open && query.trim().length > 0
  const go = (index: number) => {
    // A real click on the link, so the page change gets its usual storm.
    list.current?.querySelectorAll('a')[index]?.click()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!results.length) return
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + results.length) % results.length)
    } else if (event.key === 'Escape') {
      if (showing) setOpen(false)
      else setQuery('')
    }
  }

  return (
    <div className="home-search" ref={box}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          if (results.length) go(active)
        }}
      >
        <label htmlFor={`${id}-q`} className="visually-hidden">
          Search books and writers
        </label>
        <svg className="home-search-icon" viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          ref={input}
          id={`${id}-q`}
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search for a book, a writer or a genre"
          value={query}
          role="combobox"
          aria-expanded={showing}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showing && results.length ? `${id}-${active}` : undefined}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="home-search-go">
          Search
        </button>
      </form>

      {showing && (
        <div className="home-search-panel">
          {results.length > 0 ? (
            <ul id={`${id}-list`} role="listbox" ref={list} aria-label="Books and writers">
              {results.map((entry, i) => (
                <li
                  key={`${entry.kind}-${entry.href}-${entry.title}`}
                  id={`${id}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onPointerEnter={() => setActive(i)}
                >
                  <Link href={entry.href} tabIndex={-1} onClick={() => setOpen(false)}>
                    <span
                      className={`home-search-mark ${entry.kind}`}
                      style={{ '--mark': entry.colour } as React.CSSProperties}
                      aria-hidden
                    >
                      {entry.kind === 'writer' ? entry.title.trim()[0] : null}
                    </span>
                    <span className="home-search-text">
                      <span className="home-search-title">{entry.title}</span>
                      <span className="home-search-detail">
                        {entry.kind === 'book' ? 'Book' : 'Writer'} · {entry.detail}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="home-search-empty" role="status">
              Nothing matches “{query.trim()}”. <Link href="/books">See every book</Link>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
