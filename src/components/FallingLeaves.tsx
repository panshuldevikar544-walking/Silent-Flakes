'use client'

import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// Reds and oranges of the tree on the first book's cover.
const COLOURS = ['#c22a1c', '#dc4a1f', '#ea6a22', '#f28c2c', '#a82318', '#e8582a']

const TOP = 2.7 // above the top of the picture
const GROUND = -1.27 // just above the book's shadow
const SETTLE = 0.45 // how far above the ground a leaf starts to lie down
const FADE = 0.7 // seconds to vanish
// Leaves have their own layer so the shadow under the book does not draw them as squares.
const LAYER = 1

const seededRandom = (start: number) => {
  let seed = start
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

/** A pointed leaf with a stem and veins, drawn in white so each leaf can be tinted. */
function leafTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const draw = canvas.getContext('2d')!

  draw.fillStyle = '#ffffff'
  draw.beginPath()
  draw.moveTo(64, 4)
  draw.bezierCurveTo(80, 24, 112, 40, 106, 72)
  draw.bezierCurveTo(102, 96, 80, 104, 64, 108)
  draw.bezierCurveTo(48, 104, 26, 96, 22, 72)
  draw.bezierCurveTo(16, 40, 48, 24, 64, 4)
  draw.fill()

  draw.strokeStyle = '#c9c9c9'
  draw.lineCap = 'round'
  draw.lineWidth = 3
  draw.beginPath()
  draw.moveTo(64, 14)
  draw.lineTo(64, 106)
  for (const y of [40, 58, 76]) {
    draw.moveTo(64, y + 12)
    draw.lineTo(38, y)
    draw.moveTo(64, y + 12)
    draw.lineTo(90, y)
  }
  draw.stroke()

  draw.strokeStyle = '#d8d8d8'
  draw.lineWidth = 5
  draw.beginPath()
  draw.moveTo(64, 104)
  draw.quadraticCurveTo(66, 116, 74, 124)
  draw.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Autumn leaves that drift down behind and beside the book, rest where its shadow
 * falls for a second or two, then vanish and start again from the top.
 */
export function FallingLeaves({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const camera = useThree((s) => s.camera)

  const leaves = useMemo(() => {
    // Fixed seed so the fall looks the same on every visit.
    const random = seededRandom(11)
    return Array.from({ length: count }, () => {
      const x = (random() - 0.5) * 3.4
      // In the air a leaf stays behind the book, so it never looks like a mark on the cover.
      const z = -0.9 - random() * 0.7
      // Where it comes to rest: drawn in towards the middle, on the book's shadow.
      const landX = x * 0.55
      const landZ = -0.55 + random() * 0.9
      const speed = 0.15 + random() * 0.15
      const fall = (TOP - GROUND) / speed
      const rest = 1 + random()
      const life = fall + rest + FADE
      return {
        x,
        z,
        landX,
        landZ,
        speed,
        fall,
        rest,
        life,
        offset: random() * life,
        size: 0.06 + random() * 0.045,
        spin: 0.5 + random(),
        phase: random() * Math.PI * 2,
        colour: COLOURS[Math.floor(random() * COLOURS.length)],
      }
    })
  }, [count])

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(2, 2, 6, 6)
    const points = plane.attributes.position
    // A slight curl, so a leaf does not look like a flat sticker.
    for (let i = 0; i < points.count; i++) {
      points.setZ(i, points.getX(i) ** 2 * 0.3 - points.getY(i) ** 2 * 0.12)
    }
    plane.setAttribute('fade', new THREE.InstancedBufferAttribute(new Float32Array(count), 1))
    return plane
  }, [count])
  const texture = useMemo(() => leafTexture(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => texture.dispose(), [texture])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const place = (time: number) => {
    const fade = mesh.current!.geometry.attributes.fade as THREE.InstancedBufferAttribute
    leaves.forEach((leaf, i) => {
      const age = (time + leaf.offset) % leaf.life
      // Everything below stops changing once the leaf has landed.
      const flying = Math.min(age, leaf.fall)
      const y = TOP - flying * leaf.speed
      const lying = THREE.MathUtils.smoothstep(GROUND + SETTLE - y, 0, SETTLE)
      const sway = Math.sin(flying * 0.9 + leaf.phase)

      const drawnIn = (flying / leaf.fall) ** 2
      // Only near the ground, below the book, does it come forward.
      const forward = THREE.MathUtils.smoothstep(-0.8 - y, 0, -0.8 - GROUND)
      dummy.position.set(
        THREE.MathUtils.lerp(leaf.x, leaf.landX, drawnIn) + sway * 0.22,
        y,
        THREE.MathUtils.lerp(leaf.z, leaf.landZ, forward),
      )
      dummy.rotation.set(
        THREE.MathUtils.lerp(Math.sin(flying * leaf.spin + leaf.phase) * 1.1, -1.05, lying),
        THREE.MathUtils.lerp(Math.sin(flying * leaf.spin * 0.7) * 0.9, 0, lying),
        leaf.phase + sway * 0.7,
      )
      dummy.scale.setScalar(leaf.size)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)

      const gone = Math.max(0, age - leaf.fall - leaf.rest) / FADE
      fade.setX(i, Math.min(1, age / 0.4) * (1 - gone))
    })
    mesh.current!.instanceMatrix.needsUpdate = true
    fade.needsUpdate = true
  }

  useLayoutEffect(() => {
    camera.layers.enable(LAYER)
    const colour = new THREE.Color()
    leaves.forEach((leaf, i) => mesh.current!.setColorAt(i, colour.set(leaf.colour)))
    mesh.current!.instanceColor!.needsUpdate = true
    place(0)
  })
  useFrame(({ clock }) => place(clock.elapsedTime))

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      layers={LAYER}
    >
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
        alphaTest={0.02}
        toneMapped={false}
        // Gives every leaf its own see-through amount, for vanishing one at a time.
        onBeforeCompile={(shader) => {
          shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nattribute float fade;\nvarying float vFade;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade = fade;')
          shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', '#include <common>\nvarying float vFade;')
            .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vFade;')
        }}
      />
    </instancedMesh>
  )
}
