#!/usr/bin/env node
/**
 * Removes black matte from grochain-logo-3d (JPEG-in-PNG) → true transparent PNG.
 * Run from client/: node scripts/knockout-logo-background.js
 */
const fs = require('fs')
const path = require('path')
const jpeg = require('jpeg-js')
const { PNG } = require('pngjs')

const TH = 58
const SOFT = 52

function main() {
  const publicDir = path.join(__dirname, '..', 'public')
  const input = path.join(publicDir, 'grochain-logo-3d.bak.png')
  const fallback = path.join(publicDir, 'grochain-logo-3d.png')
  const source = fs.existsSync(input) ? input : fallback
  const output = path.join(publicDir, 'grochain-logo-3d.png')
  const transparent = path.join(publicDir, 'grochain-logo-3d-transparent.png')

  const buf = fs.readFileSync(source)
  let decoded
  try {
    decoded = jpeg.decode(buf, { useTArray: true })
  } catch {
    console.error('Expected JPEG-encoded logo file at', source)
    process.exit(1)
  }

  const { width, height, data } = decoded
  const png = new PNG({ width, height })

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const max = Math.max(r, g, b)
    png.data[i] = r
    png.data[i + 1] = g
    png.data[i + 2] = b
    if (max <= TH) png.data[i + 3] = 0
    else if (max <= TH + SOFT) png.data[i + 3] = Math.round(((max - TH) / SOFT) * 255)
    else png.data[i + 3] = 255
  }

  const outBuf = PNG.sync.write(png)
  fs.writeFileSync(output, outBuf)
  fs.writeFileSync(transparent, outBuf)
  console.log(`✅ Transparent logo written (${width}x${height})`)
}

main()
