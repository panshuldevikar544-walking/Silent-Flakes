import * as THREE from 'three'

import type { BookVisual } from '@/lib/data'
import { textOn } from '@/lib/colour'

const FAMILY = "'Schibsted Grotesk Variable', sans-serif"

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function surface(width: number, height: number, colour: string) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = textOn(colour)
  return { canvas, ctx }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else line = next
  }
  return [...lines, line]
}

/** Typeset front cover, used until a real cover image is uploaded. */
export function titleCover(book: BookVisual) {
  const { canvas, ctx } = surface(1024, 1536, book.colour)
  let size = 150
  let lines: string[] = []
  do {
    ctx.font = `700 ${size}px ${FAMILY}`
    lines = wrap(ctx, book.title, 860)
    size -= 8
  } while (size > 60 && (lines.length > 4 || lines.some((l) => ctx.measureText(l).width > 860)))
  lines.forEach((line, i) => ctx.fillText(line, 82, 210 + i * size * 1.12))
  ctx.font = `500 54px ${FAMILY}`
  ctx.fillText(book.author, 82, 1340)
  ctx.font = `400 36px ${FAMILY}`
  ctx.fillText('Silent Flakes', 82, 1430)
  return toTexture(canvas)
}

export function backCover(book: BookVisual) {
  const { canvas, ctx } = surface(1024, 1536, book.colour)
  ctx.font = `600 52px ${FAMILY}`
  ctx.fillText('Silent Flakes', 82, 1420)
  return toTexture(canvas)
}

export function spineArt(book: BookVisual, thickness: number) {
  const height = 1536
  const width = Math.max(80, Math.round((thickness / 2.1) * height))
  const { canvas, ctx } = surface(width, height, book.colour)
  // Read from top to bottom, as on an English-language shelf.
  ctx.translate(width / 2, 0)
  ctx.rotate(Math.PI / 2)
  ctx.textBaseline = 'middle'
  const size = Math.min(width * 0.42, 70)
  ctx.font = `700 ${size}px ${FAMILY}`
  ctx.fillText(book.title, 90, 0, 900)
  ctx.font = `400 ${size * 0.75}px ${FAMILY}`
  ctx.textAlign = 'right'
  ctx.fillText(book.author, height - 90, 0, 430)
  const texture = toTexture(canvas)
  // The spine model's UVs come from glTF: no vertical flip, mirrored across.
  texture.flipY = false
  texture.repeat.x = -1
  texture.offset.x = 1
  return texture
}
