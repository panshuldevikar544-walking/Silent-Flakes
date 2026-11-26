'use client'

import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import type { BookVisual } from '@/lib/data'

import type { Motif } from './FallingLeaves'

const BookScene = dynamic(() => import('./BookScene'), { ssr: false })

export type View = 'front' | 'spine' | 'back'

/** Flat cover shown while the 3D book loads, or when 3D is not available. */
function FlatCover({ book }: { book: BookVisual }) {
  return (
    <div className="flat-cover" style={{ background: book.colour }}>
      {book.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.coverUrl} alt="" />
      ) : (
        <span>
          <strong>{book.title}</strong>
          {book.author}
        </span>
      )}
    </div>
  )
}

class Boundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

let webgl: boolean | undefined
const supportsWebGL = () => {
  if (webgl === undefined) {
    try {
      webgl = Boolean(document.createElement('canvas').getContext('webgl2'))
    } catch {
      webgl = false
    }
  }
  return webgl
}

const never = () => () => {}
const onServer = () => false

export function BookStage({ book, motif = null }: { book: BookVisual; motif?: Motif | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const can3d = useSyncExternalStore(never, supportsWebGL, onServer)
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(true)
  const [view, setView] = useState<View | null>('front')
  // Once the book turns or is dragged, no side is "selected", so any button works again.
  const clearView = useCallback(() => setView(null), [])
  const showReady = useCallback(() => setReady(true), [])

  // Tell the page the book is ready to show (see IntroMotion), once, on the stage itself.
  // (Asks WebGL directly: while the page hydrates, can3d still holds the server's "no".)
  useEffect(() => {
    const stage = ref.current
    if (!(ready || !supportsWebGL()) || !stage || stage.dataset.ready) return
    stage.dataset.ready = '1'
    stage.dispatchEvent(new CustomEvent('stage-ready', { bubbles: true }))
  }, [ready])

  // Stop drawing when the book is scrolled out of sight.
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const fallback = <FlatCover book={book} />

  return (
    <div className="stage" ref={ref}>
      <div
        className="stage-canvas"
        role="img"
        aria-label={`${book.title} by ${book.author}, shown as a book you can turn`}
      >
        {!ready && fallback}
        {can3d && (
          <Boundary fallback={fallback}>
            <BookScene
              book={book}
              view={view}
              onMove={clearView}
              motif={motif}
              active={visible}
              onReady={showReady}
            />
          </Boundary>
        )}
      </div>
      {ready && (
        <div className="stage-views" role="group" aria-label="Turn the book">
          {(['front', 'spine', 'back'] as const).map((name) => (
            <button key={name} type="button" aria-pressed={view === name} onClick={() => setView(name)}>
              {name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
