'use client'

import { ContactShadows, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import type { BookVisual } from '@/lib/data'
import { backCover, spineArt, titleCover } from './bookTextures'
import { FallingLeaves } from './FallingLeaves'
import type { View } from './BookStage'

const MODEL = '/models/book_parts.glb'
const W = 1.4
const H = 2.1
const ANGLES: Record<View, number> = { front: -0.42, spine: Math.PI / 2 - 0.12, back: Math.PI - 0.42 }
// The idle motion: one slow turn about every 25 seconds, and a gentle rise and fall.
const SPIN = 0.25 // radians a second
const FLOAT = 0.08 // how far it rises and falls
// Seconds the book holds still before it starts turning again.
const AFTER_ENTRANCE = 3
const AFTER_DRAG = 2
const AFTER_VIEW = 5

type Props = {
  book: BookVisual
  /** The chosen side, or null once the book has moved away from it. */
  view: View | null
  onMove: () => void
  leaves: boolean
  active: boolean
  onReady: () => void
}

function CoverImage({ url, ...mesh }: { url: string } & React.ComponentProps<'mesh'>) {
  const loaded = useLoader(THREE.TextureLoader, url)
  const texture = useMemo(() => {
    const map = loaded.clone()
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    map.needsUpdate = true
    return map
  }, [loaded])
  return (
    <mesh {...mesh}>
      <planeGeometry args={[W - 0.012, H - 0.012]} />
      <meshStandardMaterial map={texture} roughness={0.55} />
    </mesh>
  )
}

function Book({ book, view, onMove, onReady }: Omit<Props, 'leaves' | 'active'>) {
  const { nodes } = useGLTF(MODEL, false) as unknown as { nodes: Record<string, THREE.Mesh> }
  const [clothMap, pageMap] = useLoader(THREE.TextureLoader, [
    '/textures/cloth_normal.png',
    '/textures/page_edges.png',
  ])
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const turn = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const drag = useRef({ active: false, x: 0 })
  const hold = useRef(AFTER_ENTRANCE)
  const speed = useRef(0)

  const hard = book.binding === 'hardcover'
  const board = hard ? 0.045 : 0.012
  const thickness = THREE.MathUtils.clamp(book.pageCount * 0.0011, 0.1, 0.5)
  const outer = thickness + board * 2

  const art = useMemo(
    () => ({
      front: book.coverUrl ? null : titleCover(book),
      back: book.backUrl ? null : backCover(book),
      spine: spineArt(book, outer),
    }),
    [book, outer],
  )
  useEffect(
    () => () => {
      art.front?.dispose()
      art.back?.dispose()
      art.spine.dispose()
    },
    [art],
  )

  const cloth = useMemo(() => {
    const map = clothMap.clone()
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(2.5, 3.75)
    map.needsUpdate = true
    return map
  }, [clothMap])
  const pages = useMemo(() => {
    const map = pageMap.clone()
    map.colorSpace = THREE.SRGBColorSpace
    map.flipY = false
    map.needsUpdate = true
    return map
  }, [pageMap])

  // One entrance: the book turns from its spine to its cover.
  useLayoutEffect(() => {
    const group = turn.current!
    const timeline = gsap
      .timeline()
      .fromTo(group.rotation, { y: Math.PI / 2 }, { y: ANGLES.front, duration: 2.2, ease: 'power3.out' })
      .fromTo(group.position, { y: -0.35 }, { y: 0, duration: 1.8, ease: 'power3.out' }, 0)
    return () => {
      timeline.kill()
    }
  }, [])

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!view) return
    hold.current = AFTER_VIEW
    speed.current = 0
    // Take the short way round, however many turns the book has already made.
    const from = turn.current!.rotation.y
    const full = Math.PI * 2
    const step = THREE.MathUtils.euclideanModulo(ANGLES[view] - from + Math.PI, full) - Math.PI
    gsap.killTweensOf(turn.current!.rotation)
    const tween = gsap.to(turn.current!.rotation, {
      y: from + step,
      duration: 1.1,
      ease: 'power2.inOut',
      onUpdate: () => invalidate(),
    })
    // The tween is not killed on cleanup: view turns null while the book carries on.
    // A new view or a drag stops it with killTweensOf.
    void tween
  }, [view, invalidate])

  useEffect(() => {
    onReady()
  }, [onReady])

  // Drag to turn. Vertical swipes still scroll the page (touch-action: pan-y).
  useEffect(() => {
    const el = gl.domElement
    const down = (e: PointerEvent) => {
      gsap.killTweensOf(turn.current!.rotation)
      drag.current = { active: true, x: e.clientX }
      speed.current = 0
      onMove()
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!drag.current.active) return
      turn.current!.rotation.y += (e.clientX - drag.current.x) * 0.01
      drag.current.x = e.clientX
      invalidate()
    }
    const up = () => {
      if (drag.current.active) hold.current = AFTER_DRAG
      drag.current.active = false
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [gl, invalidate, onMove])

  useFrame(({ pointer, clock }, delta) => {
    if (!tilt.current || !turn.current) return
    // A long gap (scrolled away, another tab) must not make the book jump.
    const step = Math.min(delta, 0.05)
    if (!drag.current.active) {
      if (hold.current > 0) hold.current -= step
      else {
        if (speed.current === 0) onMove()
        speed.current += (SPIN - speed.current) * Math.min(1, step * 1.5)
        turn.current.rotation.y += speed.current * step
      }
    }
    const ease = 1 - Math.pow(0.002, delta)
    tilt.current.rotation.x += (-pointer.y * 0.08 - tilt.current.rotation.x) * ease
    tilt.current.rotation.y += (pointer.x * 0.14 - tilt.current.rotation.y) * ease
    tilt.current.position.y = Math.sin(clock.elapsedTime * 1.1) * FLOAT
  })

  const kind = hard ? 'Hard' : 'Soft'
  const pageWidthOffset = hard ? -0.022 : -0.001
  const coverMaterial = (
    <meshStandardMaterial
      color={book.colour}
      roughness={hard ? 0.85 : 0.5}
      normalMap={hard ? cloth : null}
      normalScale={new THREE.Vector2(0.6, 0.6)}
    />
  )
  const face = outer / 2 + 0.0015

  return (
    <group ref={tilt}>
      <group ref={turn}>
        {[1, -1].map((side) => (
          <mesh
            key={side}
            geometry={nodes[`${kind}Board`].geometry}
            position={[0, 0, side * (thickness / 2 + board / 2)]}
            castShadow
            receiveShadow
          >
            {coverMaterial}
          </mesh>
        ))}
        <mesh
          geometry={nodes[`${kind}Pages`].geometry}
          position={[pageWidthOffset, 0, 0]}
          scale={[1, 1, thickness]}
          castShadow
        >
          <meshStandardMaterial map={pages} roughness={0.95} />
        </mesh>
        <mesh geometry={nodes[`${kind}Spine`].geometry} position={[-W / 2, 0, 0]} scale={[1, 1, outer]} castShadow>
          <meshStandardMaterial map={art.spine} roughness={hard ? 0.85 : 0.5} side={THREE.DoubleSide} />
        </mesh>
        {art.front ? (
          <mesh position={[0, 0, face]}>
            <planeGeometry args={[W - 0.012, H - 0.012]} />
            <meshStandardMaterial map={art.front} roughness={0.6} />
          </mesh>
        ) : (
          <CoverImage url={book.coverUrl!} position={[0, 0, face]} />
        )}
        {art.back ? (
          <mesh position={[0, 0, -face]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[W - 0.012, H - 0.012]} />
            <meshStandardMaterial map={art.back} roughness={0.6} />
          </mesh>
        ) : (
          <CoverImage url={book.backUrl!} position={[0, 0, -face]} rotation={[0, Math.PI, 0]} />
        )}
      </group>
    </group>
  )
}

/** Pulls the camera back on narrow screens so the book always fits. */
function Framing() {
  const { camera, size, invalidate } = useThree()
  useLayoutEffect(() => {
    const aspect = size.width / size.height
    camera.position.set(0, 0.15, Math.max(5.3, 3.9 / aspect))
    camera.lookAt(0, 0, 0)
    invalidate()
  }, [camera, size, invalidate])
  return null
}

export default function BookScene({ book, view, onMove, leaves, active, onReady }: Props) {
  const [small] = useState(() => window.innerWidth < 700)
  const [fontReady, setFontReady] = useState(false)

  // Canvas textures need the web font before they are drawn.
  useEffect(() => {
    let live = true
    Promise.all([
      document.fonts.load("700 100px 'Schibsted Grotesk Variable'"),
      document.fonts.load("400 40px 'Schibsted Grotesk Variable'"),
    ]).finally(() => live && setFontReady(true))
    return () => {
      live = false
    }
  }, [])

  if (!fontReady) return null

  return (
    <Canvas
      shadows={small ? false : 'percentage'}
      dpr={[1, small ? 1.5 : 2]}
      // The motion runs for every visitor, including those whose device asks to reduce it.
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: 'pan-y', cursor: 'grab' }}
    >
      <Framing />
      <hemisphereLight args={['#f4f8fb', '#6b7a86', 1.5]} />
      <directionalLight
        position={[-2.5, 3, 4]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[4, 1, -2]} intensity={0.9} color="#cfe0ee" />
      <Suspense fallback={null}>
        <Book
          book={book}
          view={view}
          onMove={onMove}
          onReady={onReady}
        />
        <ContactShadows position={[0, -1.3, 0]} opacity={0.38} scale={6} blur={2.6} far={2} />
      </Suspense>
      {leaves && <FallingLeaves count={small ? 34 : 56} />}
    </Canvas>
  )
}
