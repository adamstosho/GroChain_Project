// Generates public/og-image.png (1200x630) from the designed GroChain icon + wordmark.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '../public');
const DEEP = '#0B3D1E';
const GRASS = '#22C55E';

async function run() {
  const iconPath = path.join(PUBLIC, 'logo-icon.png');
  if (!fs.existsSync(iconPath)) {
    console.error('Missing public/logo-icon.png — run npm run generate:icons first');
    process.exit(1);
  }

  const WIDTH = 1200;
  const HEIGHT = 630;
  const ICON = 220;
  const iconBuf = await sharp(iconPath)
    .resize(ICON, ICON, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const bg = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${DEEP}"/>
      <stop offset="100%" stop-color="#062814"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <text x="${WIDTH / 2}" y="420" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="72" fill="#ffffff">GroChain</text>
  <text x="${WIDTH / 2}" y="475" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="28" fill="${GRASS}">Building Trust in Nigeria's Food Chain</text>
</svg>`);

  await sharp(bg)
    .composite([{ input: iconBuf, top: 90, left: Math.round((WIDTH - ICON) / 2) }])
    .png()
    .toFile(path.join(PUBLIC, 'og-image.png'));

  console.log('Generated og-image.png (1200x630)');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
