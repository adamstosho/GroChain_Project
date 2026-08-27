/**
 * Builds all in-app logo assets from the designed masters in
 * design/03-brand-assets/logo/source/ (and client/public/brand/).
 *
 * Masters (designed by Adam / brand sheet):
 *   - logo-icon-master.png  — circular mark on black
 *   - logo-full-lockup.png  — primary horizontal lockup on white
 *
 * Run: npm run generate:icons
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, '../design/03-brand-assets/logo/source');
const PUBLIC = path.join(ROOT, 'public');
const BRAND = path.join(PUBLIC, 'brand');
const LOGOS = path.join(PUBLIC, 'logos');

const DEEP = '#0B3D1E';
const FOREST = '#166534';
const GRASS = '#22C55E';

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

/** Near-black pixels → transparent (for icon master on black). */
async function blackToTransparent(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // Soft key: pure/near-black plate → transparent; keep green/white logo pixels
    if (lum < 22 && Math.max(r, g, b) - Math.min(r, g, b) < 18) {
      data[i + 3] = 0;
    } else if (lum < 38 && Math.max(r, g, b) - Math.min(r, g, b) < 22) {
      data[i + 3] = Math.round(data[i + 3] * ((lum - 22) / 16));
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();
}

/** Near-white pixels → transparent (for lockup on white). */
async function whiteToTransparent(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 245 && g > 245 && b > 245) data[i + 3] = 0;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
}

async function roundedTile(iconBuf, size, fill) {
  const pad = Math.round(size * 0.12);
  const iconSize = size - pad * 2;
  const radius = Math.round(size * 0.22);
  const icon = await sharp(iconBuf)
    .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svg = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GRASS}"/>
      <stop offset="100%" stop-color="${DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="${fill === 'gradient' ? 'url(#g)' : fill}"/>
</svg>`);

  return sharp(svg)
    .composite([{ input: icon, top: pad, left: pad }])
    .png()
    .toBuffer();
}

async function run() {
  ensureDir(SOURCE);
  ensureDir(BRAND);
  ensureDir(LOGOS);

  const iconMaster = path.join(SOURCE, 'logo-icon-master.png');
  const fullMaster = path.join(SOURCE, 'logo-full-lockup.png');

  if (!fs.existsSync(iconMaster) || !fs.existsSync(fullMaster)) {
    console.error('Missing masters in design/03-brand-assets/logo/source/');
    process.exit(1);
  }

  console.log('Processing designed GroChain logo masters…');

  // Transparent icon + lockup for UI
  const iconClear = await blackToTransparent(iconMaster);
  const fullClear = await whiteToTransparent(fullMaster);

  await sharp(iconClear).png().toFile(path.join(PUBLIC, 'logo-icon.png'));
  await sharp(iconClear).png().toFile(path.join(BRAND, 'logo-icon.png'));
  await sharp(fullClear).png().toFile(path.join(PUBLIC, 'logo-full.png'));
  await sharp(fullClear).png().toFile(path.join(BRAND, 'logo-full.png'));

  // Keep JPEG masters accessible in public/brand (already copied)
  // Square raster for legacy SVG consumers → write a tiny placeholder SVG that points conceptually
  // (app now uses PNG). Still write logo-icon.svg as PNG-wrapped? Better: skip SVG geometry;
  // write a simple SVG image href for optional use.
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
  <image width="512" height="512" xlink:href="/logo-icon.png"/>
</svg>`;
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="320" viewBox="0 0 1024 320">
  <image width="1024" height="320" preserveAspectRatio="xMidYMid meet" xlink:href="/logo-full.png"/>
</svg>`;
  fs.writeFileSync(path.join(PUBLIC, 'logo-icon.svg'), iconSvg);
  fs.writeFileSync(path.join(PUBLIC, 'logo.svg'), fullSvg);

  // App icons / favicons on deep green tile (guidelines)
  const tileSizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' },
  ];

  for (const { size, name } of tileSizes) {
    const buf = await roundedTile(iconClear, size, DEEP);
    await sharp(buf).png().toFile(path.join(PUBLIC, name));
    console.log(`Generated ${name}`);
  }

  // favicon.ico (32)
  const fav32 = await roundedTile(iconClear, 32, DEEP);
  await sharp(fav32).png().toFile(path.join(PUBLIC, 'favicon.ico'));
  console.log('Generated favicon.ico');

  // Lockup PNG exports for docs / emails (overwrite any legacy leaf assets)
  await sharp(fullClear).resize(200, null, { fit: 'inside' }).png().toFile(path.join(LOGOS, 'logo-200x60.png'));
  await sharp(fullClear).resize(400, null, { fit: 'inside' }).png().toFile(path.join(LOGOS, 'logo-400x120.png'));
  await sharp(fullClear).resize(800, null, { fit: 'inside' }).png().toFile(path.join(LOGOS, 'logo-800x240.png'));
  await sharp(iconClear).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(LOGOS, 'logo-icon-256.png'));

  // Gradient tile variant (guidelines)
  const grad512 = await roundedTile(iconClear, 512, 'gradient');
  await sharp(grad512).png().toFile(path.join(BRAND, 'logo-icon-tile-gradient.png'));
  const deep512 = await roundedTile(iconClear, 512, DEEP);
  await sharp(deep512).png().toFile(path.join(BRAND, 'logo-icon-tile-deep.png'));

  console.log('Logo generation from designed masters completed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
