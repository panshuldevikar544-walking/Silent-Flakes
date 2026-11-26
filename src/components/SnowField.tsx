'use client'

import { useEffect, useRef } from 'react'

/**
 * A quiet snowfall behind the home page opening: small, pale, slow flakes that never compete
 * with the book. It stops while the page is hidden or scrolled away, and visitors who ask for
 * less motion get a still scatter of flakes instead.
 */
export function SnowField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    type Flake = { x: number; y: number; r: number; speed: number; sway: number; phase: number; alpha: number }
    let flakes: Flake[] = []
    let width = 0
    let height = 0
    let frame = 0
    let visible = true

    const make = (anywhere: boolean): Flake => {
      const depth = Math.random()
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -6,
        r: 0.8 + depth * 2,
        speed: 0.15 + depth * 0.45,
        sway: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + depth * 0.4,
      }
    }

    const size = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = Math.round(Math.min(90, (width * height) / 16000))
      flakes = Array.from({ length: count }, () => make(true))
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)
      for (const f of flakes) {
        context.globalAlpha = f.alpha
        context.beginPath()
        context.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        context.fill()
      }
    }

    const tick = (time: number) => {
      for (const f of flakes) {
        f.y += f.speed
        f.x += Math.sin(time / 2400 + f.phase) * f.sway * 0.25
        if (f.y > height + 6) Object.assign(f, make(false))
      }
      draw()
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      cancelAnimationFrame(frame)
      if (!still && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }

    size()
    context.fillStyle = getComputedStyle(canvas).color
    draw()
    start()

    const resize = new ResizeObserver(() => {
      size()
      context.fillStyle = getComputedStyle(canvas).color
      draw()
    })
    resize.observe(canvas)
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    })
    seen.observe(canvas)
    document.addEventListener('visibilitychange', start)

    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      seen.disconnect()
      document.removeEventListener('visibilitychange', start)
    }
  }, [])

  return <canvas ref={ref} className="snow-field" aria-hidden />
}
