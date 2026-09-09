import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'

function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = []
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c >>> 0
    }
  }
  let c = 0xffffffff
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x >= x0 + r && x <= x1 - r) return y >= y0 && y <= y1
  if (y >= y0 + r && y <= y1 - r) return x >= x0 && x <= x1
  const cx = x < x0 + r ? x0 + r : x1 - r
  const cy = y < y0 + r ? y0 + r : y1 - r
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r
}
function inTri(x, y, ax, ay, bx, by, cx, cy) {
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by)
  const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy)
  const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay)
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}
function makePng(size) {
  const G = [7, 193, 96]
  const rows = []
  const rr = size * 0.2
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4)
    row[0] = 0
    const ny = y / size
    for (let x = 0; x < size; x++) {
      const nx = x / size
      const i = 1 + x * 4
      const corners = [[rr, rr], [size - rr, rr], [rr, size - rr], [size - rr, size - rr]]
      const insideBg = corners.some(function (c) { return (x - c[0]) ** 2 + (y - c[1]) ** 2 <= rr * rr }) ||
        (x >= rr && x <= size - rr) || (y >= rr && y <= size - rr)
      if (!insideBg) continue
      row[i] = G[0]; row[i + 1] = G[1]; row[i + 2] = G[2]; row[i + 3] = 255
      const inBubble = inRoundRect(nx, ny, 0.15, 0.2, 0.85, 0.62, 0.09)
      const inTail = inTri(nx, ny, 0.3, 0.6, 0.46, 0.6, 0.38, 0.82)
      if (inBubble || inTail) { row[i] = 255; row[i + 1] = 255; row[i + 2] = 255; row[i + 3] = 255 }
      for (const dx of [0.28, 0.5, 0.72]) {
        const dd = Math.hypot(nx - dx, ny - 0.41)
        if (dd < 0.035) { row[i] = G[0]; row[i + 1] = G[1]; row[i + 2] = G[2] }
      }
    }
    rows.push(row)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const idat = zlib.deflateSync(Buffer.concat(rows))
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))
  ])
}
const outDir = process.argv[2] || 'public'
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon-192.png'), makePng(192))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), makePng(512))
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), makePng(180))
fs.writeFileSync(path.join(outDir, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="102" fill="#07c160"/><rect x="77" y="102" width="358" height="215" rx="46" fill="#fff"/><path d="M154 307 L236 307 L195 420 Z" fill="#fff"/><circle cx="154" cy="210" r="18" fill="#07c160"/><circle cx="256" cy="210" r="18" fill="#07c160"/><circle cx="358" cy="210" r="18" fill="#07c160"/></svg>')
console.log('bubble icons generated in', outDir)
