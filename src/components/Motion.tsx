'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { coverLead } from './PageTransition'

gsap.registerPlugin(ScrollTrigger, SplitText)

let lenis: Lenis | null = null

/**
 * Smooth scrolling and the scroll-driven motion of every page. Pages mark what moves
 * with data attributes, so they stay server-rendered:
 *  data-split        headline whose lines rise into place
 *  data-scatter      page title whose letters fly in from scattered places and land in order
 *  data-reveal       fades up when it scrolls into view (data-reveal="stagger" does its children one by one)
 *  data-parallax=N   drifts at a different speed while scrolling (N: -1…1)
 *  data-marquee      a line of text that slides sideways as you scroll
 *  data-shrink       a full-width panel that pulls in to a rounded card as you scroll past
 *  data-turn=N       turns by N degrees while it crosses the screen
 * Visitors whose device asks for less motion get none of it, and normal scrolling.
 */
export function Motion() {
  const path = usePathname()

  // One smooth scroller for the whole visit.
  useEffect(() => {
    lenis = new Lenis({ lerp: 0.11, anchors: { offset: -84 } })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis?.destroy()
      lenis = null
    }
  }, [])

  // The motion of the page now shown, rebuilt on every page change.
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true })

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
        gsap.set(el, { visibility: 'visible' })
        SplitText.create(el, {
          type: 'lines,words',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 115,
              rotate: 4,
              duration: 1.1,
              ease: 'expo.out',
              stagger: 0.09,
              delay: Number(el.dataset.delay ?? 0.15) + coverLead(),
              scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            }),
        })
      })

      // The same arrival as the home page headline: each letter starts somewhere random,
      // turned and scaled, and springs into its place.
      gsap.utils.toArray<HTMLElement>('[data-scatter]').forEach((el) => {
        gsap.set(el, { visibility: 'visible' })
        const random = gsap.utils.random
        const { chars } = SplitText.create(el, { type: 'words,chars' })
        gsap.from(chars, {
          autoAlpha: 0,
          x: () => random(-260, 260),
          y: () => random(-220, 220),
          rotate: () => random(-120, 120),
          scale: () => random(0.2, 2.4),
          duration: 1.3,
          ease: 'expo.out',
          stagger: { each: 0.025, from: 'random' },
          delay: Number(el.dataset.delay ?? 0.1) + coverLead(),
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.set(el, { visibility: 'visible' })
        const targets = el.dataset.reveal === 'stagger' ? el.children : el
        gsap.from(targets, {
          y: 70,
          opacity: 0,
          rotate: el.dataset.reveal === 'stagger' ? 2.5 : 0,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const speed = Number(el.dataset.parallax) || 0.2
        gsap.fromTo(
          el,
          { y: () => window.innerHeight * speed * 0.5 },
          {
            y: () => -window.innerHeight * speed * 0.5,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-turn]').forEach((el) => {
        const degrees = Number(el.dataset.turn) || 10
        gsap.fromTo(
          el,
          { rotate: -degrees / 2 },
          {
            rotate: degrees / 2,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-marquee]').forEach((el) => {
        gsap.fromTo(
          el,
          { xPercent: 0 },
          {
            xPercent: -35,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-shrink]').forEach((el) => {
        gsap.to(el, {
          scale: 0.94,
          borderBottomLeftRadius: '3rem',
          borderBottomRightRadius: '3rem',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
        })
      })
    })

    // Images and fonts change heights after load, so measure again once they settle.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const late = window.setTimeout(refresh, 800)
    return () => {
      window.removeEventListener('load', refresh)
      window.clearTimeout(late)
      ctx.revert()
    }
  }, [path])

  return null
}
