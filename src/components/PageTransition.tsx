'use client'

import gsap from 'gsap'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'

import { openingLead } from './Opening'

export const STORM = 'page-storm'

// What the wind can catch: the blocks a page is built from, outermost first.
const PIECES =
  'h1, h2, h3, h4, p, li, img, canvas, figure, blockquote, .button, .book-card, .carousel-item, .step, .hero-now, .flake, .scribble, .house-badge, .genre-pills, .stage-views'
// Left to the page's own opening motion when it arrives.
const OWN_MOTION = '[data-split], [data-scatter], [data-reveal], .hero'

type Flake = { x: number; y: number; z: number; len: number; drift: number }
/** Which way the wind blows: 1 left to right (deeper into the site), -1 right to left (back towards home). */
type Wind = 1 | -1

// Moving many pieces at once costs frames on phones; past this many, the rest fade with the page.
const MOST_PIECES = 40

const depth = (path: string) => path.split('/').filter(Boolean).length
/** Back towards home (or anywhere shallower) blows the other way. */
const windFor = (to: string, from: string): Wind => (to === '/' || depth(to) < depth(from) ? -1 : 1)

/**
 * The change between pages is a snowstorm. Going deeper into the site, wind and snow sweep
 * in from the left and blow the page's pieces off to the right; going back towards home the
 * storm blows the other way; under the whiteout the next page loads, and as the
 * storm passes its pieces drift in on the tail of the wind and settle into place.
 * The header stays put. Book cards keep their own show (BookLink), and new tabs, modifier
 * clicks, other sites, the admin and links within the same page are plain links.
 */
export function PageTransition() {
  const router = useRouter()
  const path = usePathname()
  const storm = useRef<{ canvas: HTMLCanvasElement; strength: { value: number }; stop: () => void } | null>(null)
  const exit = useRef<gsap.core.Timeline | null>(null)
  const arrive = useRef<gsap.core.Timeline | null>(null)
  const wind = useRef<Wind>(1)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest?.('a')
      if (!link || link.dataset.transition === 'none' || link.hasAttribute('download')) return
      if (link.target && link.target !== '_self') return
      const url = new URL(link.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) return
      if (url.pathname === location.pathname) return // same page, or a jump within it

      // Before Next's own link handler, so the storm starts before the page changes.
      event.preventDefault()
      event.stopPropagation()
      // Mid-storm on the way out: let it finish. Mid-arrival: settle this page at once.
      if (exit.current) return
      arrive.current?.progress(1)
      storm.current?.stop()
      storm.current = null
      const href = url.pathname + url.search + url.hash
      router.prefetch(href)

      const from = location.pathname
      const dir = windFor(url.pathname, from)
      wind.current = dir
      storm.current = startStorm(dir)
      const main = document.querySelector('main')
      const pieces = visiblePieces(main)
      const W = window.innerWidth

      // The wind reaches its own side of the screen first, so pieces there go first.
      const tl = gsap.timeline()
      exit.current = tl
      tl.to(storm.current.strength, { value: 1, duration: 0.7, ease: 'power2.in' }, 0)
      pieces.forEach((piece) => {
        const box = piece.getBoundingClientRect()
        const reach = dir === 1 ? box.left / W : (W - box.right) / W
        tl.to(
          piece,
          {
            x: dir * gsap.utils.random(W * 0.35, W * 0.75),
            y: gsap.utils.random(-140, 80),
            rotate: dir * gsap.utils.random(-28, 38),
            scale: gsap.utils.random(0.7, 1),
            autoAlpha: 0,
            duration: 0.9,
            ease: 'power2.in',
            force3D: true,
          },
          0.05 + reach * 0.3 + gsap.utils.random(0, 0.08),
        )
      })
      // Whatever is left (panels, backgrounds) fades into the whiteout.
      if (main) tl.to(main, { opacity: 0, duration: 0.35, ease: 'power1.in' }, 0.6)
      // Start loading the next page while the old one is still blowing away.
      tl.call(() => router.push(href), [], 0.45)

      // If the next page never arrives, calm the storm and put this one back.
      window.setTimeout(() => {
        const stuck = storm.current
        if (!stuck || location.pathname !== from) return
        tl.kill()
        exit.current = null
        gsap.set([...pieces, main], { clearProps: 'transform,opacity,visibility' })
        gsap.to(stuck.strength, { value: 0, duration: 0.6, onComplete: stuck.stop })
        storm.current = null
      }, 8000)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router])

  // The new page is in, still hidden under the snow: before it is drawn, put its pieces
  // out to the left, then let the tail of the wind carry them into place.
  useLayoutEffect(() => {
    const current = storm.current
    if (!current) return
    exit.current?.kill()
    exit.current = null
    // Arrive at the top of the new page; Motion settles its smooth scroller there too.
    window.scrollTo(0, 0)
    const main = document.querySelector('main')
    const pieces = visiblePieces(main).filter((piece) => !piece.closest(OWN_MOTION))
    const dir = wind.current
    const W = window.innerWidth
    gsap.set(main, { opacity: 0 })
    // They come in from the side the wind blows from.
    gsap.set(pieces, {
      x: () => -dir * gsap.utils.random(120, W * 0.3),
      y: () => gsap.utils.random(-60, 60),
      rotate: () => dir * gsap.utils.random(-18, 12),
      autoAlpha: 0,
      force3D: true,
    })

    const done = () => {
      current.stop()
      if (storm.current === current) storm.current = null
      if (arrive.current === tl) arrive.current = null
    }
    const tl = gsap.timeline({ onComplete: done })
    arrive.current = tl
    tl.to(main, { opacity: 1, duration: 0.35, ease: 'power1.out', clearProps: 'opacity' }, 0.1)
    pieces.forEach((piece) => {
      const box = piece.getBoundingClientRect()
      tl.to(
        piece,
        {
          x: 0,
          y: 0,
          rotate: 0,
          autoAlpha: 1,
          duration: 1.35,
          ease: 'expo.out',
          clearProps: 'transform,opacity,visibility',
        },
        // The ones furthest downwind land first, the ones nearest the wind's side last.
        0.2 + ((dir === 1 ? W - box.right : box.left) / W) * 0.35 + gsap.utils.random(0, 0.1),
      )
    })
    tl.to(current.strength, { value: 0, duration: 1.7, ease: 'power2.out' }, 0.15)

    // Whatever happens to the timeline, the snow never outstays the arrival.
    const backstop = window.setTimeout(done, 5000)
    return () => {
      window.clearTimeout(backstop)
      tl.progress(1)
    }
  }, [path])

  return null
}

/** Extra wait for a page's opening motion while the storm is still passing over it. */
export const coverLead = () =>
  typeof document === 'undefined' ? 0 : document.getElementById(STORM) ? 0.35 : openingLead()

/** The outermost catchable pieces of the page that are on screen now. */
function visiblePieces(main: Element | null) {
  if (!main) return []
  const found = [...main.querySelectorAll<HTMLElement>(PIECES)].filter((el) => {
    const box = el.getBoundingClientRect()
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight
  })
  const outer = found.filter((el) => !found.some((other) => other !== el && other.contains(el)))
  return outer.slice(0, MOST_PIECES)
}

/** A soft round flake drawn once, then stamped for every flake on every frame. */
function flakeSprite(colour: string) {
  const size = 32
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = size
  const c = sprite.getContext('2d')!
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, colour)
  g.addColorStop(0.55, colour)
  g.addColorStop(1, 'rgb(0 0 0 / 0)')
  c.fillStyle = g
  c.fillRect(0, 0, size, size)
  return sprite
}

/**
 * A full-screen blizzard on a canvas, blowing the way `dir` says; its strength runs 0 to 1.
 * Kept light so it holds its frame rate on phones: a capped pixel ratio, fewer flakes on
 * small screens, and each flake stamped from one ready-made image rather than drawn.
 */
function startStorm(dir: Wind) {
  document.getElementById(STORM)?.remove()
  const canvas = document.createElement('canvas')
  canvas.id = STORM
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  const context = canvas.getContext('2d')!
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  context.scale(ratio, ratio)

  const snow = getComputedStyle(document.documentElement).getPropertyValue('--twilight').trim() || '#f3ead8'
  const sprite = flakeSprite(snow)
  const count = Math.round(Math.min(650, (width * height) / 1800))
  // Positions run along the wind: 0 is the side it comes from, `width` the side it goes to.
  const flakes: Flake[] = Array.from({ length: count }, () => ({
    x: Math.random() * width * 1.6 - width * 0.6,
    y: Math.random() * height,
    z: Math.random() * 0.8 + 0.2,
    len: Math.random() * 0.6 + 0.4,
    drift: Math.random() * 2 - 1,
  }))
  // A soft warm glow in the thick of the storm, brightest where the wind comes from. Made
  // once; its strength is set by the alpha it is painted with.
  const gx = dir === 1 ? width * 0.2 : width * 0.8
  const glow = context.createRadialGradient(gx, height * 0.45, 0, gx, height * 0.45, width * 0.9)
  glow.addColorStop(0, 'rgb(243 234 216 / 0.2)')
  glow.addColorStop(1, 'rgb(243 234 216 / 0)')

  const strength = { value: 0 }
  let frame = 0
  let last = performance.now()

  const draw = (now: number) => {
    const dt = Math.min((now - last) / 16.7, 3)
    last = now
    const s = strength.value
    context.clearRect(0, 0, width, height)

    if (s > 0.01) {
      context.globalAlpha = s * s
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
    }

    const shown = Math.round(count * Math.min(1, s * 1.3))
    const fade = Math.min(1, s * 2)
    const t = now / 600
    for (let i = 0; i < count; i++) {
      const f = flakes[i]
      // A steady blow rather than a gale: fast enough to read as wind, slow enough to watch.
      f.x += (2 + 13 * s) * f.z * dt
      f.y += (0.6 + f.drift * 1.1 + 1.2 * s) * f.z * dt + Math.sin(t * f.len + i) * 0.4 * f.z
      if (f.x > width + 40 || f.y > height + 20) {
        f.x = -40 - Math.random() * width * 0.3
        f.y = Math.random() * height * 1.1 - height * 0.1
      }
      if (i >= shown) continue
      // Near flakes are big and soft, far ones small and faint; the wind gives each a short tail.
      const r = 0.8 + 4 * f.z * f.z * f.len
      const x = dir === 1 ? f.x : width - f.x
      const alpha = (0.3 + 0.7 * f.z) * fade
      const tail = 7 * s * f.z
      if (tail > 2) {
        context.globalAlpha = alpha * 0.3
        context.drawImage(sprite, dir === 1 ? x - tail : x - r, f.y - r * 0.6, tail + r, r * 1.2)
      }
      context.globalAlpha = alpha
      context.drawImage(sprite, x - r, f.y - r, r * 2, r * 2)
    }
    context.globalAlpha = 1
    frame = requestAnimationFrame(draw)
  }
  frame = requestAnimationFrame(draw)

  return {
    canvas,
    strength,
    stop: () => {
      cancelAnimationFrame(frame)
      canvas.remove()
    },
  }
}
