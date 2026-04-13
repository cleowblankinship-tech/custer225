// Generates public/icon-192.png and public/icon-512.png
// Run with: node scripts/generate-icons.mjs

import { createWriteStream } from 'fs'
import { deflateSync } from 'zlib'
import { mkdirSync } from 'fs'

mkdirSync('public', { recursive: true })

function createPNG(size) {
  const bg = { r: 0x8B, g: 0x73, b: 0x55 } // #8B7355 accent color

  // Raw image data: filter byte (0) + RGB pixels per row
  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(size * rowSize)
  for (let y = 0; y < size; y++) {
    const off = y * rowSize
    raw[off] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3 + 0] = bg.r
      raw[off + 1 + x * 3 + 1] = bg.g
      raw[off + 1 + x * 3 + 2] = bg.b
    }
  }

  const compressed = deflateSync(raw)

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const typeB = Buffer.from(type)
    const crcBuf = Buffer.concat([typeB, data])
    const crc = crc32(crcBuf)
    const crcOut = Buffer.alloc(4)
    crcOut.writeInt32BE(crc)
    return Buffer.concat([len, typeB, data, crcOut])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)   // width
  ihdr.writeUInt32BE(size, 4)   // height
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xFFFFFFFF
  const table = makeCRCTable()
  for (const byte of buf) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF]
  return (crc ^ 0xFFFFFFFF) | 0
}
function makeCRCTable() {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
}

createWriteStream('public/icon-192.png').end(createPNG(192))
createWriteStream('public/icon-512.png').end(createPNG(512))
console.log('✓ Generated public/icon-192.png and public/icon-512.png')
