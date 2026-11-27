'use client'

import React, { useEffect } from 'react'

import { Flake } from './Flake'

/** When the curtain starts to open, in seconds from the first paint. Pages time their entrance from it. */
export const OPENING_LIFT = 1.3
/** When it is fully gone (matches the stylesheet). */
const OPENING_END = 2.15

// The curtain's strips, of uneven widths, so the opening reads as torn rather than ruled.
const STRIPS = [1.4, 0.6, 1, 0.8, 1.6, 0.5, 1.2, 0.9, 1.5, 0.7, 1.1, 1.3]

// One wide band of snow with a soft wavy top, two waves (50 units) per circle width. It
// slides sideways by one wave on a loop while it rises, so the drift seems to settle.
const DRIFT =
  'M-100 6 Q-87.5 0 -75 6 T-50 6 T-25 6 T0 6 T25 6 T50 6 T75 6 T100 6 T125 6 T150 6 T175 6 T200 6 V130 H-100 Z'

/**
 * The first thing a visitor sees whenever the site is opened or reloaded. A flake drops
 * onto the night, a thin ring draws itself up round where it landed and fills with drifting
 * snow, the house mark appears in it, and then the night splits into uneven strips that
 * slide away onto the page. It is all CSS, so it plays from the very first frame without
 * waiting for scripts; this only takes it away at the end. Moving between pages keeps the
 * layout, so the snowstorm plays then instead.
 */
export function Opening() {
  useEffect(() => {
    const html = document.documentElement
    if (!html.classList.contains('is-opening')) return
    const left = OPENING_END * 1000 - (performance.now() - paintedAt())
    const timer = window.setTimeout(() => html.classList.remove('is-opening'), Math.max(0, left))
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="opening" id="opening" aria-hidden>
      <div className="opening-strips">
        {STRIPS.map((grow, i) => (
          <i key={i} style={{ '--i': i, flexGrow: grow } as React.CSSProperties} />
        ))}
      </div>
      <div className="opening-glow" />
      <div className="opening-inner">
        <span className="opening-drop" />
        {/* Everything in the bowl moves only by sliding or turning whole pieces, which the
            graphics card plays on time even while the page is still busy loading. */}
        <div className="opening-bowl">
          <div className="opening-pool">
            <div className="opening-fill">
              <svg className="opening-wave behind" viewBox="-100 0 300 130" preserveAspectRatio="none">
                <path d={DRIFT} />
              </svg>
              <svg className="opening-wave" viewBox="-100 0 300 130" preserveAspectRatio="none">
                <path d={DRIFT} />
              </svg>
            </div>
          </div>
          <span className="opening-half left">
            <i />
          </span>
          <span className="opening-half right">
            <i />
          </span>
        </div>
        <Flake className="flake opening-mark" />
        <p className="opening-name">Silent Flakes</p>
      </div>
    </div>
  )
}

/** When the layout's inline script ran: just before the first paint, when the curtain starts. */
const paintedAt = () => Number(document.documentElement.dataset.openAt ?? 0)

/** Seconds left before the opening curtain opens, or 0 once it has (or never ran). */
export function openingLead() {
  if (typeof document === 'undefined') return 0
  if (!document.documentElement.classList.contains('is-opening')) return 0
  return Math.max(0, OPENING_LIFT - (performance.now() - paintedAt()) / 1000)
}
