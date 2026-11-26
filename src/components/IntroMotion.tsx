'use client'

import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useEffect } from 'react'

import { coverLead } from './PageTransition'

gsap.registerPlugin(SplitText)

const SEEN = 'sf-intro-seen'

/**
 * The home page's arrival: the headline's letters fly in from scattered places, the book
 * rises into view once it is ready, and the rest settles round them. The first visit in a
 * session gets the full pace; coming back to the home page later plays it a little faster.
 */
export function IntroMotion() {
  useEffect(() => {
    const first = !sessionStorage.getItem(SEEN)
    const flat = '0px 0px 0px 0px rgba(0,0,0,0), 0px 0px 0px 0px rgba(0,0,0,0)'

    const ctx = gsap.context(() => {
      const headline = document.querySelector('.hero-copy h1')
      const letters = headline ? SplitText.create(headline, { type: 'words,chars' }).chars : []
      const random = gsap.utils.random

      // The hero waits hidden (see .motion in the styles) until this shows it.
      gsap.set('.hero-copy, .hero-book', { visibility: 'visible' })
      // The book waits, unseen, until it is ready, then arrives once (below).
      gsap.set('.hero-book .stage', { autoAlpha: 0 })

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: () => sessionStorage.setItem(SEEN, '1'),
      })

      if (first) tl.from('.site-header', { yPercent: -110, duration: 1 }, 0)
      tl.from('.hero-copy .eyebrow', { autoAlpha: 0, x: -50, duration: 1 }, 0.1)
        .from(
          letters,
          {
            autoAlpha: 0,
            x: () => random(-260, 260),
            y: () => random(-220, 220),
            rotate: () => random(-120, 120),
            scale: () => random(0.2, 2.4),
            duration: 1.3,
            stagger: { each: 0.02, from: 'random' },
          },
          0.05,
        )
        .from('.hero-intro', { autoAlpha: 0, y: 24, filter: 'blur(12px)', duration: 1.1 }, 0.45)
        .from(
          '.hero-now',
          { autoAlpha: 0, y: 40, scale: 0.92, boxShadow: flat, duration: 1.2 },
          0.6,
        )
        .from('.hero-mark .flake', { rotate: -150, scale: 0.4, autoAlpha: 0, duration: 2 }, 0)
        .from('.snow-field', { autoAlpha: 0, duration: 1.5, ease: 'power1.out' }, 0)
        // The shapes behind the headline swell up from below like a tide coming in.
        .from('.hero-blobs', { yPercent: 35, autoAlpha: 0, duration: 1.6 }, 0)

      if (!first) tl.timeScale(1.35)
      tl.delay(coverLead())
    })

    // The book's one entrance. The 3D book turns from its spine to its cover by itself
    // (BookScene); here it rises out of the page and comes into view while it turns. It
    // waits for the 3D book, so the flat stand-in never shows first. Only the drawing
    // moves: the 3D view measures its box, so the boxes around it stay still.
    const stage = document.querySelector<HTMLElement>('.hero-book .stage')
    let shown = false
    const arrive = () => {
      if (shown || !stage) return
      shown = true
      const drawing = stage.querySelector('canvas, .flat-cover')
      const views = stage.querySelector('.stage-views')
      ctx.add(() => {
        const timeline = gsap
          .timeline({ delay: 0.15 + coverLead() })
          .to(stage, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, 0)
        if (drawing) timeline.from(drawing, { y: 90, scale: 0.82, duration: 1.9, ease: 'expo.out' }, 0)
        if (views) timeline.from(views, { autoAlpha: 0, y: 20, duration: 0.8, ease: 'expo.out' }, 0.9)
      })
    }
    if (stage?.dataset.ready) arrive()
    stage?.addEventListener('stage-ready', arrive)
    // If the 3D book is slow, show the flat cover rather than an empty space.
    const wait = window.setTimeout(arrive, 3500)

    return () => {
      window.clearTimeout(wait)
      stage?.removeEventListener('stage-ready', arrive)
      ctx.revert()
    }
  }, [])

  return null
}
