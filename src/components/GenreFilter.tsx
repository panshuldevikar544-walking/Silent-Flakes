'use client'

import gsap from 'gsap'
import React, { useState } from 'react'

/**
 * Genre buttons above the shelf. The cards stay server-rendered; each carries its genres in
 * data-genres, and choosing a genre hides the others (and any group left empty).
 */
export function GenreFilter({ genres }: { genres: string[] }) {
  const [chosen, setChosen] = useState<string | null>(null)

  const choose = (genre: string | null) => {
    setChosen(genre)
    const cards = document.querySelectorAll<HTMLElement>('[data-genres]')
    cards.forEach((card) => {
      card.hidden = genre !== null && !card.dataset.genres!.split('|').includes(genre)
    })
    document.querySelectorAll<HTMLElement>('[data-group]').forEach((group) => {
      group.hidden = !group.querySelector('[data-genres]:not([hidden])')
    })
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(
        [...cards].filter((c) => !c.hidden),
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' },
      )
    }
  }

  if (genres.length < 2) return null

  return (
    <div className="genre-filter" role="group" aria-label="Show books by genre">
      <button type="button" aria-pressed={chosen === null} onClick={() => choose(null)}>
        All
      </button>
      {genres.map((genre) => (
        <button key={genre} type="button" aria-pressed={chosen === genre} onClick={() => choose(genre)}>
          {genre}
        </button>
      ))}
    </div>
  )
}
