import * as THREE from 'three'

import type { BookVisual } from '@/lib/data'
import { textOn } from '@/lib/colour'

const SANS = "'Schibsted Grotesk Variable', sans-serif"
const SERIF = "'Fraunces Variable', Georgia, serif"
const TEXT = "'Literata Variable', Georgia, serif"

/** Faces the canvas covers are set in; load these before drawing. */
export const COVER_FONTS = [
  "700 100px 'Schibsted Grotesk Variable'",
  "400 40px 'Schibsted Grotesk Variable'",
  "400 40px 'Fraunces Variable'",
  "italic 400 40px 'Fraunces Variable'",
  "400 30px 'Literata Variable'",
]

const CW = 1024
const CH = 1536

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

/* ---------- Paper ---------- */

let grainCanvas: HTMLCanvasElement | null = null
/** A tile of paper: fine speckle and short fibres, mid-grey on average. */
function grain() {
  if (grainCanvas) return grainCanvas
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(size, size)
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 60
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v
    image.data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  ctx.lineCap = 'round'
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const a = Math.random() * Math.PI
    const len = 3 + Math.random() * 12
    ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)'
    ctx.lineWidth = 0.6 + Math.random() * 0.8
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    ctx.stroke()
  }
  grainCanvas = canvas
  return canvas
}

/**
 * Prints the surface onto paper: a fine grain over everything, the scored hinge a
 * paperback folds at beside the spine, and a little wear where the edges are handled.
 */
function finish(ctx: CanvasRenderingContext2D, spine: 'left' | 'right' | null) {
  const { width: w, height: h } = ctx.canvas
  ctx.save()
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = 0.32
  ctx.fillStyle = ctx.createPattern(grain(), 'repeat')!
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // The hinge: a soft valley with a lit ridge beside it.
  if (spine) {
    const x = spine === 'left' ? w * 0.045 : w * 0.955
    const dir = spine === 'left' ? 1 : -1
    const valley = ctx.createLinearGradient(x - 10 * dir, 0, x + 10 * dir, 0)
    valley.addColorStop(0, 'rgba(0,0,0,0)')
    valley.addColorStop(0.5, 'rgba(40,25,10,0.13)')
    valley.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = valley
    ctx.fillRect(Math.min(x - 10 * dir, x + 10 * dir), 0, 20, h)
    ctx.fillStyle = 'rgba(255,255,255,0.10)'
    ctx.fillRect(x + 10 * dir - (dir < 0 ? 4 : 0), 0, 4, h)
  }

  // Handling: the outer edges a shade darker than the middle.
  const edge = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.45,
    w / 2,
    h / 2,
    Math.hypot(w, h) * 0.56,
  )
  edge.addColorStop(0, 'rgba(60,40,20,0)')
  edge.addColorStop(1, 'rgba(60,40,20,0.10)')
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, w, h)
}

let grainNormalTexture: THREE.CanvasTexture | null = null
/** The same paper as a normal map, so light catches the grain as the book turns. Shared. */
export function grainNormal() {
  if (grainNormalTexture) return grainNormalTexture
  const size = 256
  const source = grain().getContext('2d')!.getImageData(0, 0, size, size).data
  const height = (x: number, y: number) =>
    source[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const out = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (height(x + 1, y) - height(x - 1, y)) * 2
      const dy = (height(x, y + 1) - height(x, y - 1)) * 2
      const len = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      out.data[i] = (-dx / len) * 127 + 128
      out.data[i + 1] = (dy / len) * 127 + 128
      out.data[i + 2] = (1 / len) * 127 + 128
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(5, 7.5)
  grainNormalTexture = texture
  return texture
}

/* ---------- Colours from a cover image ---------- */

export type Tones = { paper: string; accent: string | null }

const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

/** The cover's ground colour (its commonest) and its strongest colour, for the back and spine. */
export function tonesOf(image: HTMLImageElement): Tones | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 72
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(image, 0, 0, 48, 72)
    const data = ctx.getImageData(0, 0, 48, 72).data
    const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
    for (let i = 0; i < data.length; i += 4) {
      const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
      const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
      bucket.n++
      bucket.r += data[i]
      bucket.g += data[i + 1]
      bucket.b += data[i + 2]
      buckets.set(key, bucket)
    }
    let paper = { n: 0, r: 0, g: 0, b: 0 }
    let accent: typeof paper | null = null
    let best = 0
    for (const bucket of buckets.values()) {
      if (bucket.n > paper.n) paper = bucket
      const r = bucket.r / bucket.n
      const g = bucket.g / bucket.n
      const b = bucket.b / bucket.n
      const max = Math.max(r, g, b)
      const sat = max ? (max - Math.min(r, g, b)) / max : 0
      const score = bucket.n * sat * sat * (max > 70 && max < 235 ? 1 : 0)
      if (bucket.n >= 3 && score > best) {
        best = score
        accent = bucket
      }
    }
    const avg = (b: typeof paper) => hex(b.r / b.n, b.g / b.n, b.b / b.n)
    return { paper: avg(paper), accent: accent ? avg(accent) : null }
  } catch {
    return null
  }
}

/* ---------- Covers ---------- */

/** Typeset front cover, used until a real cover image is uploaded. */
export function titleCover(book: BookVisual) {
  const { canvas, ctx } = surface(CW, CH, book.colour)
  let size = 150
  let lines: string[] = []
  do {
    ctx.font = `700 ${size}px ${SANS}`
    lines = wrap(ctx, book.title, 860)
    size -= 8
  } while (size > 60 && (lines.length > 4 || lines.some((l) => ctx.measureText(l).width > 860)))
  lines.forEach((line, i) => ctx.fillText(line, 82, 210 + i * size * 1.12))
  ctx.font = `500 54px ${SANS}`
  ctx.fillText(book.author, 82, 1340)
  ctx.font = `400 36px ${SANS}`
  ctx.fillText('Silent Flakes', 82, 1430)
  finish(ctx, 'left')
  return toTexture(canvas)
}

/** An uploaded front cover, printed on the same paper as the rest of the book. */
export function imageCover(image: HTMLImageElement, spine: 'left' | 'right' = 'left') {
  const canvas = document.createElement('canvas')
  canvas.width = CW
  canvas.height = CH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0, CW, CH)
  finish(ctx, spine)
  return toTexture(canvas)
}

/** A strip of the front cover's art, mirrored so it wraps round the spine, fading out. */
function band(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  from: number,
  to: number,
  fade: 'down' | 'up',
) {
  const height = Math.round((to - from) * CH)
  const strip = document.createElement('canvas')
  strip.width = CW
  strip.height = height
  const s = strip.getContext('2d')!
  s.translate(CW, 0)
  s.scale(-1, 1)
  const ih = image.naturalHeight || image.height
  const iw = image.naturalWidth || image.width
  s.drawImage(image, 0, from * ih, iw, (to - from) * ih, 0, 0, CW, height)
  s.setTransform(1, 0, 0, 1, 0, 0)
  s.globalCompositeOperation = 'destination-in'
  const g =
    fade === 'down'
      ? s.createLinearGradient(0, 0, 0, height)
      : s.createLinearGradient(0, height, 0, 0)
  g.addColorStop(0, 'rgba(0,0,0,1)')
  g.addColorStop(0.5, 'rgba(0,0,0,0.85)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  s.fillStyle = g
  s.fillRect(0, 0, CW, height)
  ctx.drawImage(strip, 0, from * CH)
}

function flake(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(size / 24, size / 24)
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (const turn of [0, 60, 120]) {
    ctx.save()
    ctx.rotate((turn * Math.PI) / 180)
    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(0, 10)
    ctx.moveTo(-3, -7.5)
    ctx.lineTo(0, -5)
    ctx.lineTo(3, -7.5)
    ctx.moveTo(-3, 7.5)
    ctx.lineTo(0, 5)
    ctx.lineTo(3, 7.5)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

const L = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
]
const G = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
]
const PARITY = [
  'LLLLLL',
  'LLGLGG',
  'LLGGLG',
  'LLGGGL',
  'LGLLGG',
  'LGGLLG',
  'LGGGLL',
  'LGLGLG',
  'LGLGGL',
  'LGGLGL',
]
const flip = (bits: string) => bits.replace(/./g, (b) => (b === '1' ? '0' : '1'))

/** The ISBN as a real, scannable EAN-13 barcode, on a white label. */
function barcode(ctx: CanvasRenderingContext2D, isbn: string, x: number, y: number) {
  const digits = isbn.replace(/\D/g, '')
  if (digits.length !== 13) return
  const d = [...digits].map(Number)
  let bits = '101'
  for (let i = 0; i < 6; i++) bits += (PARITY[d[0]][i] === 'L' ? L : G)[d[i + 1]]
  bits += '01010'
  for (let i = 7; i < 13; i++) bits += flip(L[d[i]])
  bits += '101'

  const w = 290
  const h = 176
  const bar = 2.4
  const left = x + (w - bits.length * bar) / 2 + 6
  ctx.save()
  ctx.fillStyle = '#fffdf8'
  ctx.shadowColor = 'rgba(40,25,10,0.18)'
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 4)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#1b1612'
  ctx.font = `500 17px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText(
    `ISBN ${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`,
    x + w / 2,
    y + 28,
  )
  const top = y + 40
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] !== '1') continue
    const guard = i < 3 || (i >= 45 && i < 50) || i >= 92
    ctx.fillRect(left + i * bar, top, bar, guard ? 106 : 96)
  }
  ctx.font = `400 20px ${SANS}`
  ctx.fillText(digits[0], left - 12, top + 114)
  ctx.fillText(digits.slice(1, 7), left + 48 * bar - 24 * bar, top + 114)
  ctx.fillText(digits.slice(7), left + 71 * bar, top + 114)
  ctx.textAlign = 'left'
}

/**
 * The back cover, drawn when none is uploaded: the front's art wrapping round from the
 * spine, the book's line and blurb, the authors, the house mark and the ISBN barcode.
 */
export function backCover(book: BookVisual, front?: HTMLImageElement | null, tones?: Tones | null) {
  const ground = tones?.paper ?? book.colour
  const { canvas, ctx } = surface(CW, CH, ground)
  const ink = textOn(ground)
  const accent = book.accent ?? tones?.accent ?? ink

  if (front) {
    band(ctx, front, 0, 0.27, 'down')
    band(ctx, front, 0.89, 1, 'up')
  }

  const x = 112
  const width = CW - x * 2
  let y = front ? 470 : 230

  if (book.line) {
    ctx.fillStyle = accent
    ctx.font = `italic 400 50px ${SERIF}`
    for (const line of wrap(ctx, book.line, width)) {
      ctx.fillText(line, x, y)
      y += 60
    }
    y += 34
  }

  if (book.blurb) {
    // Fit the blurb above the authors' line, shrinking the type a little if it is long.
    const room = 1135 - y
    let size = 30
    let lines: string[] = []
    for (; size >= 23; size -= 1) {
      ctx.font = `400 ${size}px ${TEXT}`
      lines = wrap(ctx, book.blurb, width)
      if (lines.length * size * 1.55 <= room) break
    }
    const fit = Math.floor(room / (size * 1.55))
    if (lines.length > fit) {
      lines = lines.slice(0, fit)
      lines[fit - 1] = lines[fit - 1].replace(/[\s,;:.]*\S*$/, '') + '…'
    }
    ctx.fillStyle = ink
    ctx.globalAlpha = 0.88
    for (const line of lines) {
      y += size
      ctx.fillText(line, x, y)
      y += size * 0.55
    }
    ctx.globalAlpha = 1
  }

  // The authors, under a short rule.
  ctx.fillStyle = accent
  ctx.fillRect(x, 1170, 64, 3)
  ctx.fillStyle = ink
  ctx.font = `600 22px ${SANS}`
  ctx.letterSpacing = '4px'
  ctx.fillText(book.author.toUpperCase(), x, 1215, width)
  ctx.letterSpacing = '0px'

  // The house mark, bottom left; price and barcode, bottom right.
  const base = 1420
  ctx.strokeStyle = ink
  flake(ctx, x + 22, base - 12, 44)
  ctx.font = `500 34px ${SERIF}`
  ctx.fillText('Silent Flakes', x + 60, base)
  if (book.isbn) barcode(ctx, book.isbn, CW - x - 290, base - 150)
  if (book.price) {
    ctx.font = `600 22px ${SANS}`
    ctx.textAlign = 'right'
    ctx.fillText(`MRP ${book.price}`, CW - x, base - 166)
    ctx.textAlign = 'left'
  }

  finish(ctx, 'right')
  return toTexture(canvas)
}

export function spineArt(book: BookVisual, thickness: number, tones?: Tones | null) {
  const height = 1536
  const width = Math.max(80, Math.round((thickness / 2.1) * height))
  const ground = tones?.paper ?? book.colour
  const { canvas, ctx } = surface(width, height, ground)
  const accent = book.accent ?? tones?.accent ?? textOn(ground)
  // Read from top to bottom, as on an English-language shelf.
  ctx.save()
  ctx.translate(width / 2, 0)
  ctx.rotate(Math.PI / 2)
  ctx.textBaseline = 'middle'
  const size = Math.min(width * 0.42, 70)
  ctx.fillStyle = accent
  ctx.font = `${tones ? '500' : '700'} ${size}px ${tones ? SERIF : SANS}`
  ctx.fillText(book.title, 90, 0, 900)
  ctx.fillStyle = textOn(ground)
  ctx.font = `400 ${size * 0.62}px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText(book.author, height - 170, 0, 430)
  ctx.restore()
  ctx.strokeStyle = textOn(ground)
  flake(ctx, width / 2, height - 90, Math.min(width * 0.45, 40))
  finish(ctx, null)
  const texture = toTexture(canvas)
  // The spine model's UVs come from glTF: no vertical flip, mirrored across.
  texture.flipY = false
  texture.repeat.x = -1
  texture.offset.x = 1
  return texture
}
