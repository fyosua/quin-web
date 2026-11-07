// Builds a contact sheet from candidate photo URLs so they can be eyeballed in one image.
const sharp = require('sharp')
const fs = require('fs')

const input = JSON.parse(fs.readFileSync('/tmp/candidates.json', 'utf8'))
const entries = []
for (const [group, items] of Object.entries(input)) {
  items.forEach((it, i) => entries.push({ group, i, ...it }))
}

const COLS = 4
const TW = 360
const TH = 270
const sheetSize = 12

async function buildSheet(batch, file) {
  const tiles = []
  for (let idx = 0; idx < batch.length; idx++) {
    const e = batch[idx]
    const x = (idx % COLS) * TW
    const y = Math.floor(idx / COLS) * TH
    try {
      const res = await fetch(e.url, { headers: { 'user-agent': 'quin-web/0.1' } })
      if (!res.ok) throw new Error(String(res.status))
      const buf = Buffer.from(await res.arrayBuffer())
      const tile = await sharp(buf).resize(TW, TH, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer()
      tiles.push({ input: tile, left: x, top: y })
    } catch (err) {
      tiles.push({ input: { create: { width: TW, height: TH, channels: 3, background: '#333' } }, left: x, top: y })
    }
  }
  const rows = Math.ceil(batch.length / COLS)
  await sharp({ create: { width: COLS * TW, height: rows * TH, channels: 3, background: '#111' } })
    .composite(tiles)
    .jpeg({ quality: 75 })
    .toFile(file)
  console.log(file, batch.map((b, i) => `${i}:${b.group}#${b.i}`).join(' '))
}

;(async () => {
  for (let s = 0; s * sheetSize < entries.length; s++) {
    await buildSheet(entries.slice(s * sheetSize, (s + 1) * sheetSize), `/tmp/sheet-${s}.jpg`)
  }
})()