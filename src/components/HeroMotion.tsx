'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

/**
 * The home page opening as you scroll away from it: the words drift up and fade a little
 * faster than the book, so the book is the last thing to leave. Nothing is pinned, so the
 * page scrolls at its normal pace. Reduced-motion visitors get none of it.
 */
export function HeroMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const hero = document.querySelector<HTMLElement>('[data-hero]')
    if (!hero) return

    const ctx = gsap.context(() => {
      const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to('.hero-copy', { y: -90, autoAlpha: 0.15, ease: 'none', scrollTrigger: scrub })
      gsap.to('.hero-book', { y: 60, scale: 0.94, ease: 'none', scrollTrigger: scrub })
      gsap.to('.hero-mark', { rotate: 40, ease: 'none', scrollTrigger: scrub })
    }, hero)

    // The step cards swing up into their stack as each one comes on screen.
    const steps = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.step').forEach((step, i) => {
        gsap.from(step, {
          y: 160,
          rotate: i % 2 ? 14 : -14,
          scale: 0.9,
          ease: 'none',
          scrollTrigger: { trigger: step, start: 'top bottom', end: 'top 55%', scrub: 0.6 },
        })
      })
    })

    return () => {
      ctx.revert()
      steps.revert()
    }
  }, [])

  return null
}
