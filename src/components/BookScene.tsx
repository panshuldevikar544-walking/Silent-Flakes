'use client'

import { ContactShadows, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import type { BookVisual } from '@/lib/data'
import { backCover, spineArt, titleCover } from './bookTextures'
import type { View } from './BookStage'

const MODEL = '/models/book_parts.glb'
const W = 1.4
const H = 2.1
const ANGLES: Record<View, number> = { front: -0.42, spine: Math.PI / 2 - 0.12, back: Math.PI - 0.42 }

type Props = {
  book: BookVisual
  view: View
  flakes: boolean
  active: boolean
  reducedMotion: boolean
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

function Book({ book, view, reducedMotion, onReady }: Omit<Props, 'flakes' | 'active'>) {
  const { nodes } = useGLTF(MODEL, false) as unknown as { nodes: Record<string, THREE.Mesh> }
  const [clothMap, pageMap] = useLoader(THREE.TextureLoader, [
    '/textures/cloth_normal.png',
    '/textures/page_edges.png',
  ])
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const turn = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const drag = useRef({ active: false, x: 0, offset: 0 })

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
    if (reducedMotion) {
      group.rotation.y = ANGLES.front
      group.position.y = 0
      invalidate()
      return
    }
    const timeline = gsap
      .timeline()
      .fromTo(group.rotation, { y: Math.PI / 2 }, { y: ANGLES.front, duration: 2.2, ease: 'power3.out' })
      .fromTo(group.position, { y: -0.35 }, { y: 0, duration: 1.8, ease: 'power3.out' }, 0)
    return () => {
      timeline.kill()
    }
  }, [reducedMotion, invalidate])

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    drag.current.offset = 0
    const tween = gsap.to(turn.current!.rotation, {
      y: ANGLES[view],
      duration: reducedMotion ? 0 : 1.1,
      ease: 'power2.inOut',
      onUpdate: () => invalidate(),
    })
    return () => {
      tween.kill()
    }
  }, [view, reducedMotion, invalidate])

  useEffect(() => {
    onReady()
  }, [onReady])

  // Drag to turn. Vertical swipes still scroll the page (touch-action: pan-y).
  useEffect(() => {
    const el = gl.domElement
    const down = (e: PointerEvent) => {
      gsap.killTweensOf(turn.current!.rotation)
      drag.current = { ...drag.current, active: true, x: e.clientX }
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!drag.current.active) return
      turn.current!.rotation.y += (e.clientX - drag.current.x) * 0.01
      drag.current.x = e.clientX
      invalidate()
    }
    const up = () => {
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
  }, [gl, invalidate])

  useFrame(({ pointer, clock }, delta) => {
    if (reducedMotion || !tilt.current) return
    const ease = 1 - Math.pow(0.002, delta)
    tilt.current.rotation.x += (-pointer.y * 0.08 - tilt.current.rotation.x) * ease
    tilt.current.rotation.y += (pointer.x * 0.14 - tilt.current.rotation.y) * ease
    tilt.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.025
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

const seededRandom = (start: number) => {
  let seed = start
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

/** Torn paper flakes falling slowly behind and around the book. */
function Flakes({ count, still }: { count: number; still: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const flakes = useMemo(() => {
    // Fixed seed so the fall looks the same on every visit.
    const random = seededRandom(11)
    return Array.from({ length: count }, () => ({
      x: (random() - 0.5) * 8,
      y: random() * 6,
      // Always behind the book, so a flake never looks like a mark on the cover.
      z: -0.9 - random() * 2.2,
      size: 0.035 + random() * 0.065,
      speed: 0.08 + random() * 0.16,
      spin: 0.3 + random(),
      phase: random() * Math.PI * 2,
    }))
  }, [count])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const place = (time: number) => {
    flakes.forEach((f, i) => {
      const y = ((((f.y - time * f.speed) % 6) + 6) % 6) - 3
      dummy.position.set(f.x + Math.sin(time * 0.4 + f.phase) * 0.2, y, f.z)
      dummy.rotation.set(time * f.spin * 0.5 + f.phase, time * f.spin * 0.3, f.phase)
      dummy.scale.set(f.size, f.size * 0.68, f.size)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current!.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => place(0))
  useFrame(({ clock }) => {
    if (!still) place(clock.elapsedTime)
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <circleGeometry args={[1, 5]} />
      {/* Lit paper: each scrap changes shade as it turns. */}
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.35}
        roughness={0.9}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
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

export default function BookScene({ book, view, flakes, active, reducedMotion, onReady }: Props) {
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
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
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
        <Book book={book} view={view} reducedMotion={reducedMotion} onReady={onReady} />
        <ContactShadows position={[0, -1.3, 0]} opacity={0.38} scale={6} blur={2.6} far={2} frames={reducedMotion ? 1 : Infinity} />
      </Suspense>
      {flakes && <Flakes count={small ? 45 : 110} still={reducedMotion} />}
    </Canvas>
  )
}
