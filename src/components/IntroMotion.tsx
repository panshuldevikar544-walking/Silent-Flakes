'use client'

import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { useEffect } from 'react'

gsap.registerPlugin(SplitText)

const SEEN = 'sf-intro-seen'

/**
 * The home page's arrival: the headline's letters fly in from scattered places, the book
 * spins in on a spring, and the rest settles round them. The first visit in a session gets
 * the full pace; coming back to the home page later plays it a little faster. Visitors who
 * ask for less motion see the page as it is.
 */
export function IntroMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const first = !sessionStorage.getItem(SEEN)
    const flat = '0px 0px 0px 0px rgba(0,0,0,0), 0px 0px 0px 0px rgba(0,0,0,0)'

    const ctx = gsap.context(() => {
      const headline = document.querySelector('.hero-copy h1')
      const letters = headline ? SplitText.create(headline, { type: 'words,chars' }).chars : []
      const random = gsap.utils.random

      // The hero waits hidden (see .motion in the styles) until this shows it.
      gsap.set('.hero-copy, .hero-book', { visibility: 'visible' })

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: () => sessionStorage.setItem(SEEN, '1'),
      })

      if (first) tl.from('.site-header', { yPercent: -110, duration: 1 }, 0)
      // Only the drawing itself turns and grows: the 3D view measures its box (transforms
      // included) to size itself, so the box around it must stay still.
      tl.add(() => {
        const drawing = document.querySelector('.hero-book canvas, .hero-book .flat-cover')
        if (!drawing) return
        gsap.from(drawing, {
          scale: 0.1,
          rotate: -40,
          autoAlpha: 0,
          duration: 1.8,
          ease: 'elastic.out(1, 0.55)',
        })
      }, 0.1)
        .from('.hero-book .stage-views', { autoAlpha: 0, y: 20, duration: 0.8 }, 0.9)
        .from('.hero-copy .eyebrow', { autoAlpha: 0, x: -50, duration: 1 }, 0.1)
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
    })

    return () => ctx.revert()
  }, [])

  return null
}
