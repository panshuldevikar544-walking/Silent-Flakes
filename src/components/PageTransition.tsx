'use client'

import gsap from 'gsap'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'

export const STORM = 'page-storm'

// What the wind can catch: the blocks a page is built from, outermost first.
const PIECES =
  'h1, h2, h3, h4, p, li, img, canvas, figure, blockquote, .button, .book-card, .carousel-item, .step, .hero-now, .flake, .scribble, .house-badge, .genre-pills, .stage-views'
// Left to the page's own opening motion when it arrives.
const OWN_MOTION = '[data-split], [data-scatter], [data-reveal], .hero'

type Flake = { x: number; y: number; z: number; len: number; drift: number }

/**
 * The change between pages is a snowstorm. Wind and snow sweep in from the left and blow
 * the page's pieces off to the right; under the whiteout the next page loads, and as the
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

      storm.current = startStorm()
      const main = document.querySelector('main')
      const pieces = visiblePieces(main)

      // The wind reaches the left of the screen first, so pieces there go first.
      const from = location.pathname
      const tl = gsap.timeline()
      exit.current = tl
      tl.to(storm.current.strength, { value: 1, duration: 0.7, ease: 'power2.in' }, 0)
      pieces.forEach((piece) => {
        const box = piece.getBoundingClientRect()
        tl.to(
          piece,
          {
            x: gsap.utils.random(window.innerWidth * 0.5, window.innerWidth * 1.1),
            y: gsap.utils.random(-140, 80),
            rotate: gsap.utils.random(-28, 38),
            scale: gsap.utils.random(0.7, 1),
            filter: 'blur(6px)',
            autoAlpha: 0,
            duration: 0.75,
            ease: 'power2.in',
          },
          0.05 + (box.left / window.innerWidth) * 0.3 + gsap.utils.random(0, 0.08),
        )
      })
      // Whatever is left (panels, backgrounds) fades into the whiteout.
      if (main) tl.to(main, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.55)
      // Start loading the next page while the old one is still blowing away.
      tl.call(() => router.push(href), [], 0.45)

      // If the next page never arrives, calm the storm and put this one back.
      window.setTimeout(() => {
        const stuck = storm.current
        if (!stuck || location.pathname !== from) return
        tl.kill()
        exit.current = null
        gsap.set([...pieces, main], { clearProps: 'transform,filter,opacity,visibility' })
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
    gsap.set(main, { opacity: 0 })
    gsap.set(pieces, {
      x: () => gsap.utils.random(-window.innerWidth * 0.45, -160),
      y: () => gsap.utils.random(-60, 60),
      rotate: () => gsap.utils.random(-18, 12),
      filter: 'blur(6px)',
      autoAlpha: 0,
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
          filter: 'blur(0px)',
          autoAlpha: 1,
          duration: 1.2,
          ease: 'expo.out',
          clearProps: 'transform,filter,opacity,visibility',
        },
        0.2 + ((window.innerWidth - box.right) / window.innerWidth) * 0.35 + gsap.utils.random(0, 0.1),
      )
    })
    tl.to(current.strength, { value: 0, duration: 1.4, ease: 'power2.out' }, 0.15)

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
export const coverLead = () => (typeof document !== 'undefined' && document.getElementById(STORM) ? 0.35 : 0)

/** The outermost catchable pieces of the page that are on screen now. */
function visiblePieces(main: Element | null) {
  if (!main) return []
  const found = [...main.querySelectorAll<HTMLElement>(PIECES)].filter((el) => {
    const box = el.getBoundingClientRect()
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight
  })
  return found.filter((el) => !found.some((other) => other !== el && other.contains(el)))
}

/** A full-screen blizzard on a canvas, blowing left to right; its strength runs 0 to 1. */
function startStorm() {
  document.getElementById(STORM)?.remove()
  const canvas = document.createElement('canvas')
  canvas.id = STORM
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  const context = canvas.getContext('2d')!
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = width * ratio
  canvas.height = height * ratio
  context.scale(ratio, ratio)

  const snow = getComputedStyle(document.documentElement).getPropertyValue('--twilight').trim() || '#f3ead8'
  const count = Math.round(Math.min(1400, (width * height) / 1100))
  const flakes: Flake[] = Array.from({ length: count }, () => ({
    x: Math.random() * width * 1.6 - width * 0.6,
    y: Math.random() * height,
    z: Math.random() * 0.8 + 0.2,
    len: Math.random() * 0.6 + 0.4,
    drift: Math.random() * 2 - 1,
  }))
  const strength = { value: 0 }
  let frame = 0
  let last = performance.now()

  const draw = (now: number) => {
    const dt = Math.min((now - last) / 16.7, 3)
    last = now
    const s = strength.value
    context.clearRect(0, 0, width, height)

    // A soft warm glow in the thick of the storm, brightest where the wind comes from.
    if (s > 0.01) {
      const glow = context.createRadialGradient(width * 0.2, height * 0.45, 0, width * 0.2, height * 0.45, width * 0.9)
      glow.addColorStop(0, `rgb(243 234 216 / ${0.2 * s * s})`)
      glow.addColorStop(1, 'rgb(243 234 216 / 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
    }

    context.fillStyle = snow
    context.strokeStyle = snow
    context.lineCap = 'round'
    const shown = Math.round(count * Math.min(1, s * 1.3))
    for (let i = 0; i < count; i++) {
      const f = flakes[i]
      f.x += (3 + 30 * s) * f.z * dt
      f.y += (0.8 + f.drift * 1.6 + 2.2 * s) * f.z * dt + Math.sin((now / 380) * f.len + i) * 0.6 * f.z
      if (f.x > width + 40 || f.y > height + 20) {
        f.x = -40 - Math.random() * width * 0.3
        f.y = Math.random() * height * 1.1 - height * 0.1
      }
      if (i >= shown) continue
      // Near flakes are big and soft, far ones small and faint; the wind gives each a short tail.
      const r = 0.6 + 3.4 * f.z * f.z * f.len
      context.globalAlpha = (0.3 + 0.7 * f.z) * Math.min(1, s * 2)
      context.beginPath()
      context.arc(f.x, f.y, r, 0, Math.PI * 2)
      context.fill()
      const tail = 10 * s * f.z
      if (tail > 1.5) {
        context.globalAlpha *= 0.35
        context.lineWidth = r * 1.4
        context.beginPath()
        context.moveTo(f.x, f.y)
        context.lineTo(f.x - tail, f.y - tail * 0.15)
        context.stroke()
      }
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
