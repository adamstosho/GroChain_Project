/**
 * Exports designed GroChain logo variants as PNG / JPG / SVG into
 * design/03-brand-assets/logo/exports/<variant>/{svg,png,jpg}/
 *
 * Run after generate:icons: npm run generate:logo-exports
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '../public');
const BRAND = path.join(PUBLIC, 'brand');
const EXPORT_ROOT = path.join(__dirname, '../../design/03-brand-assets/logo/exports');
const DEEP = { r: 11, g: 61, b: 30 };
const WHITE = { r: 255, g: 255, b: 255 };

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

async function exportSet(folder, srcPath, { kind, jpgBg }) {
  const base = path.join(EXPORT_ROOT, folder);
  const pngDir = path.join(base, 'png');
  const jpgDir = path.join(base, 'jpg');
  const svgDir = path.join(base, 'svg');
  ensureDir(pngDir);
  ensureDir(jpgDir);
  ensureDir(svgDir);

  const name = folder.replace(/^\d+-/, '');
  // Copy master as SVG-adjacent reference (PNG wrapped note)
  fs.copyFileSync(srcPath, path.join(svgDir, `${name}-master.png`));
  fs.writeFileSync(
    path.join(svgDir, 'README.txt'),
    'Master is a designed raster logo (PNG). Prefer PNG for fidelity; JPG variants are flattened for channels that need JPG.\n'
  );

  if (kind === 'square') {
    for (const size of [16, 32, 64, 128, 256, 512, 1024]) {
      await sharp(srcPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(pngDir, `${name}-${size}x${size}.png`));
      await sharp(srcPath)
        .resize(size, size, { fit: 'contain', background: jpgBg })
        .flatten({ background: jpgBg })
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(path.join(jpgDir, `${name}-${size}x${size}.jpg`));
    }
  } else {
    for (const w of [200, 400, 800, 1200, 1600]) {
      const h = Math.round(w * 0.4);
      await sharp(srcPath)
        .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(pngDir, `${name}-${w}x${h}.png`));
      await sharp(srcPath)
        .resize(w, h, { fit: 'contain', background: jpgBg })
        .flatten({ background: jpgBg })
        .jpeg({ quality: 92, mozjpeg: true })
        .toFile(path.join(jpgDir, `${name}-${w}x${h}.jpg`));
    }
  }
  console.log(`Exported ${folder}`);
}

async function run() {
  const icon = path.join(PUBLIC, 'logo-icon.png');
  const full = path.join(PUBLIC, 'logo-full.png');
  const tileDeep = path.join(BRAND, 'logo-icon-tile-deep.png');
  const tileGrad = path.join(BRAND, 'logo-icon-tile-gradient.png');

  for (const p of [icon, full]) {
    if (!fs.existsSync(p)) {
      console.error('Missing', p, '— run npm run generate:icons first');
      process.exit(1);
    }
  }

  if (fs.existsSync(EXPORT_ROOT)) fs.rmSync(EXPORT_ROOT, { recursive: true, force: true });
  ensureDir(EXPORT_ROOT);

  await exportSet('01-full-lockup-color', full, { kind: 'wide', jpgBg: WHITE });
  await exportSet('03-icon-mark-color', icon, { kind: 'square', jpgBg: WHITE });
  if (fs.existsSync(tileDeep)) {
    await exportSet('04-icon-tile-deep', tileDeep, { kind: 'square', jpgBg: WHITE });
  }
  if (fs.existsSync(tileGrad)) {
    await exportSet('05-icon-tile-gradient', tileGrad, { kind: 'square', jpgBg: WHITE });
  }

  // White-on-dark: composite icon onto deep green for "white logo" style exports
  const whiteOnDark = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: DEEP },
  })
    .composite([
      {
        input: await sharp(icon)
          .resize(780, 780, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png()
    .toBuffer();
  const tmp = path.join(EXPORT_ROOT, '_tmp-white-icon.png');
  ensureDir(EXPORT_ROOT);
  fs.writeFileSync(tmp, whiteOnDark);
  await exportSet('02-icon-on-deep-green', tmp, { kind: 'square', jpgBg: DEEP });
  fs.unlinkSync(tmp);

  fs.writeFileSync(
    path.join(EXPORT_ROOT, 'README.md'),
    `# GroChain logo exports (designed identity)

Source masters: \`design/03-brand-assets/logo/source/\`

| Folder | Use |
|---|---|
| \`01-full-lockup-color\` | Primary horizontal logo (site, print, decks) |
| \`02-icon-on-deep-green\` | Icon on deep green \`#0B3D1E\` |
| \`03-icon-mark-color\` | Transparent mark only |
| \`04-icon-tile-deep\` | App / favicon tile |
| \`05-icon-tile-gradient\` | Gradient app tile |

Regenerate: \`npm run generate:icons && npm run generate:logo-exports\`
`
  );

  console.log('Done →', EXPORT_ROOT);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
