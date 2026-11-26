'use client'

import gsap from 'gsap'
import { useRouter } from 'next/navigation'
import React, { useRef } from 'react'

const WIPE = 'book-wipe'

/**
 * A link to a book page that opens it with a show: the card's colour floods the screen
 * from the card outwards while the cover lifts off, flies to the middle and turns
 * towards you. The book page then lifts the colour away (see BookEntrance).
 * Ctrl/Cmd-click and middle-click get a plain link.
 */
export function BookLink({
  href,
  colour,
  className,
  children,
  label,
  ...data
}: {
  'data-genres'?: string
  href: string
  colour: string
  className?: string
  children: React.ReactNode
  label?: string
}) {
  const router = useRouter()
  const ref = useRef<HTMLAnchorElement>(null)

  const open = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      document.getElementById(WIPE)
    ) {
      return
    }
    event.preventDefault()
    router.prefetch(href)

    const card = ref.current!
    const from = card.getBoundingClientRect()
    const cover = card.querySelector<HTMLImageElement>('img[data-cover]')

    const wipe = document.createElement('div')
    wipe.id = WIPE
    wipe.setAttribute('aria-hidden', 'true')
    Object.assign(wipe.style, {
      position: 'fixed',
      zIndex: '50',
      left: '0',
      top: '0',
      width: '100vw',
      height: '100vh',
      background: colour,
      pointerEvents: 'none',
      perspective: '1400px',
    })
    document.body.appendChild(wipe)

    const timeline = gsap.timeline({ onComplete: () => router.push(href, { scroll: true }) })

    // The colour grows out of the card, as a clipped rectangle that becomes the whole screen.
    const inset = (r: DOMRect) =>
      `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 24px)`
    timeline.fromTo(
      wipe,
      { clipPath: inset(from) },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.85, ease: 'expo.inOut' },
    )

    if (cover) {
      const box = cover.getBoundingClientRect()
      // A two-sided book: the cover in front, a darker board behind, so the spin never shows
      // the picture mirrored.
      const flying = document.createElement('div')
      flying.className = 'book-wipe-cover'
      const front = cover.cloneNode() as HTMLImageElement
      front.removeAttribute('data-cover')
      const back = document.createElement('span')
      back.style.background = `color-mix(in oklab, ${colour} 70%, black)`
      flying.append(back, front)
      Object.assign(flying.style, {
        position: 'fixed',
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      })
      wipe.appendChild(flying)
      const height = Math.min(window.innerHeight * 0.6, 520)
      const width = (height * box.width) / box.height
      timeline.to(
        flying,
        {
          left: (window.innerWidth - width) / 2,
          top: (window.innerHeight - height) / 2,
          width,
          height,
          rotateY: 360,
          duration: 1.05,
          ease: 'expo.inOut',
        },
        0.05,
      )
    }

    // If the page never arrives, do not leave the screen covered.
    window.setTimeout(() => document.getElementById(WIPE)?.remove(), 6000)
  }

  return (
    <a ref={ref} href={href} data-transition="none" className={className} onClick={open} onMouseEnter={() => router.prefetch(href)} aria-label={label} {...data}>
      {children}
    </a>
  )
}

/** On a book page: lifts the colour of the opening show away to reveal the page. */
export function BookEntrance() {
  React.useEffect(() => {
    const wipe = document.getElementById(WIPE)
    if (!wipe) return
    const cover = wipe.querySelector('.book-wipe-cover')
    const timeline = gsap.timeline({ delay: 0.15, onComplete: () => wipe.remove() })
    if (cover) timeline.to(cover, { scale: 0.85, opacity: 0, duration: 0.45, ease: 'power2.in' }, 0)
    timeline.to(wipe, { clipPath: 'inset(0px 0px 100% 0px round 0px 0px 48px 48px)', duration: 0.9, ease: 'expo.inOut' }, 0.2)
    // Left in place if interrupted: the next run (or BookLink's safety timer) clears it.
    return () => {
      timeline.kill()
    }
  }, [])
  return null
}
