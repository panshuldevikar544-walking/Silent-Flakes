'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A sideways row of book cards that snaps card by card. It scrolls with a trackpad, a
 * finger, the arrow keys once focused, or the two round buttons, which grey out at the ends.
 */
export function BookCarousel({ children }: { children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const [ends, setEnds] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    setEnds({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const move = (direction: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  return (
    <div className="carousel">
      <div className="carousel-buttons">
        <button
          type="button"
          aria-label="Previous books"
          disabled={ends.start}
          onClick={() => move(-1)}
        >
          <Arrow flip />
        </button>
        <button type="button" aria-label="More books" disabled={ends.end} onClick={() => move(1)}>
          <Arrow />
        </button>
      </div>
      <div
        className="carousel-track"
        ref={track}
        onScroll={measure}
        tabIndex={0}
        role="region"
        aria-label="Our books"
        data-reveal="stagger"
      >
        {children}
      </div>
    </div>
  )
}

function Arrow({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M5 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
