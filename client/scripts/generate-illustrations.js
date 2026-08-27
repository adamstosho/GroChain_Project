// Brand illustration set for the marketing homepage (hero, about, testimonial avatars).
// Style: layered flat illustration — still geometric and on-palette (no photorealism,
// no AI faces), but with enough scene, crop, and clothing detail to read as a product
// illustration rather than a placeholder. Edit this file and run
// `npm run generate:illustrations`. See design/03-brand-assets/photography/README.md.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../public');
const DESIGN_COPY = path.join(__dirname, '../../design/03-brand-assets/photography');

const P = {
  greenInk: '#2d5a3d',
  greenMid: '#166534',
  greenLight: '#8fc478',
  greenPale: '#e3f0db',
  goldMid: '#d1a84b',
  goldLight: '#f0d896',
  goldPale: '#faf1de',
  brownMid: '#914f2f',
  brownLight: '#c48657',
  brownPale: '#f2ddc6',
  cream: '#fbfcf9',
  inkNeutral: '#2d3a32',
  sky: '#eef6ea',
  cloud: '#ffffff',
  dirt: '#c9a27a',
  dirtDark: '#a67c52',
  tomato: '#c45c3e',
  tomatoDark: '#9a3f28',
  yam: '#e8c9a0',
  pepper: '#166534',
  shirtNavy: '#2d4a3a',
};

function maizeStalk(x, y, h = 110) {
  const cobY = y - h * 0.42;
  return `
  <g>
    <path d="M${x} ${y} L${x} ${y - h}" stroke="${P.greenInk}" stroke-width="5" stroke-linecap="round"/>
    <path d="M${x} ${y - h * 0.28} q -28 -18 -36 -4" fill="none" stroke="${P.greenMid}" stroke-width="7" stroke-linecap="round"/>
    <path d="M${x} ${y - h * 0.38} q 30 -16 38 -2" fill="none" stroke="${P.greenMid}" stroke-width="7" stroke-linecap="round"/>
    <path d="M${x} ${y - h * 0.55} q -22 -14 -28 -2" fill="none" stroke="${P.greenLight}" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="${x}" cy="${cobY}" rx="9" ry="22" fill="${P.goldMid}"/>
    <ellipse cx="${x}" cy="${cobY}" rx="5" ry="16" fill="${P.goldLight}"/>
    <path d="M${x} ${cobY - 22} q -6 -16 0 -22 q 6 6 0 22" fill="${P.goldLight}"/>
  </g>`;
}

function palm(x, y) {
  return `
  <g>
    <path d="M${x} ${y} L${x} ${y - 150}" stroke="${P.brownMid}" stroke-width="10" stroke-linecap="round"/>
    <path d="M${x} ${y - 148} q -70 -18 -88 18" fill="none" stroke="${P.greenInk}" stroke-width="10" stroke-linecap="round"/>
    <path d="M${x} ${y - 148} q 70 -18 88 18" fill="none" stroke="${P.greenInk}" stroke-width="10" stroke-linecap="round"/>
    <path d="M${x} ${y - 152} q -40 -55 -8 -78" fill="none" stroke="${P.greenMid}" stroke-width="9" stroke-linecap="round"/>
    <path d="M${x} ${y - 152} q 40 -55 8 -78" fill="none" stroke="${P.greenMid}" stroke-width="9" stroke-linecap="round"/>
    <path d="M${x} ${y - 150} q -78 -40 -70 8" fill="none" stroke="${P.greenLight}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${x} ${y - 150} q 78 -40 70 8" fill="none" stroke="${P.greenLight}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="${x - 14}" cy="${y - 128}" r="6" fill="${P.goldMid}"/>
    <circle cx="${x + 12}" cy="${y - 124}" r="6" fill="${P.goldMid}"/>
    <circle cx="${x - 2}" cy="${y - 118}" r="5" fill="${P.brownMid}"/>
  </g>`;
}

function crate(x, y, w = 210, h = 92) {
  const lip = 14;
  return `
  <g>
    <path d="M${x} ${y} L${x + 12} ${y + h} L${x + w - 12} ${y + h} L${x + w} ${y} Z" fill="${P.brownMid}"/>
    <path d="M${x} ${y} L${x + w} ${y} L${x + w - 8} ${y - lip} L${x + 8} ${y - lip} Z" fill="${P.brownLight}"/>
    <rect x="${x + 18}" y="${y + 18}" width="${w - 36}" height="8" rx="2" fill="${P.brownPale}" opacity="0.45"/>
    <rect x="${x + 18}" y="${y + 40}" width="${w - 36}" height="8" rx="2" fill="${P.brownPale}" opacity="0.35"/>
  </g>`;
}

function producePile(x, y) {
  return `
  <g>
    <ellipse cx="${x + 38}" cy="${y}" rx="28" ry="18" fill="${P.yam}"/>
    <ellipse cx="${x + 38}" cy="${y - 4}" rx="18" ry="10" fill="${P.goldPale}" opacity="0.7"/>
    <circle cx="${x + 92}" cy="${y - 8}" r="22" fill="${P.tomato}"/>
    <circle cx="${x + 84}" cy="${y - 14}" r="8" fill="${P.tomatoDark}" opacity="0.35"/>
    <path d="M${x + 92} ${y - 28} q -8 -10 0 -16 q 8 6 0 16" fill="${P.greenMid}"/>
    <circle cx="${x + 128}" cy="${y + 2}" r="18" fill="${P.tomatoDark}"/>
    <path d="M${x + 128} ${y - 14} q -6 -8 0 -12 q 6 4 0 12" fill="${P.greenLight}"/>
    <ellipse cx="${x + 164}" cy="${y - 6}" rx="10" ry="22" fill="${P.pepper}" transform="rotate(-18 ${x + 164} ${y - 6})"/>
    <ellipse cx="${x + 178}" cy="${y}" rx="9" ry="18" fill="${P.greenLight}" transform="rotate(12 ${x + 178} ${y})"/>
    <circle cx="${x + 58}" cy="${y + 10}" r="14" fill="${P.goldMid}"/>
    <path d="M${x + 148} ${y - 24} q 16 -22 4 -34 q -22 10 -4 34" fill="${P.greenInk}"/>
  </g>`;
}

function qrTag(x, y, s = 54) {
  const m = 8;
  return `
  <g>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="6" fill="${P.cream}" stroke="${P.greenInk}" stroke-width="3"/>
    <path d="M${x + m} ${y + m} h12 v12 h-12 z" fill="${P.greenInk}"/>
    <path d="M${x + s - m - 12} ${y + m} h12 v12 h-12 z" fill="${P.greenInk}"/>
    <path d="M${x + m} ${y + s - m - 12} h12 v12 h-12 z" fill="${P.greenInk}"/>
    <rect x="${x + s * 0.42}" y="${y + s * 0.42}" width="10" height="10" fill="${P.greenMid}"/>
    <rect x="${x + s * 0.62}" y="${y + s * 0.58}" width="7" height="7" fill="${P.greenInk}"/>
  </g>`;
}

function phone(x, y) {
  return `
  <g>
    <rect x="${x}" y="${y}" width="86" height="148" rx="16" fill="${P.inkNeutral}"/>
    <rect x="${x + 6}" y="${y + 10}" width="74" height="128" rx="8" fill="${P.cream}"/>
    <rect x="${x + 34}" y="${y + 14}" width="18" height="4" rx="2" fill="${P.greenPale}"/>
    ${qrTag(x + 16, y + 36, 54)}
    <circle cx="${x + 43}" cy="${y + 118}" r="8" fill="${P.greenMid}"/>
    <path d="M${x + 38} ${y + 118} l4 4 l8 -9" fill="none" stroke="${P.cream}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function farmerFigure(x, y) {
  return `
  <g>
    <ellipse cx="${x}" cy="${y + 86}" rx="38" ry="10" fill="${P.greenInk}" opacity="0.12"/>
    <path d="M${x - 36} ${y + 88} C${x - 36} ${y + 28}, ${x - 18} ${y + 18}, ${x} ${y + 18} C${x + 18} ${y + 18}, ${x + 36} ${y + 28}, ${x + 36} ${y + 88} Z" fill="${P.greenMid}"/>
    <path d="M${x - 20} ${y + 40} L${x - 8} ${y + 40} L${x - 14} ${y + 72} Z" fill="${P.goldMid}" opacity="0.7"/>
    <path d="M${x + 8} ${y + 40} L${x + 20} ${y + 40} L${x + 14} ${y + 72} Z" fill="${P.goldLight}" opacity="0.7"/>
    <rect x="${x - 10}" y="${y + 4}" width="20" height="18" rx="6" fill="${P.brownLight}"/>
    <circle cx="${x}" cy="${y - 18}" r="26" fill="${P.brownLight}"/>
    <path d="M${x - 28} ${y - 14} C${x - 32} ${y - 52}, ${x - 10} ${y - 62}, ${x} ${y - 62} C${x + 10} ${y - 62}, ${x + 32} ${y - 52}, ${x + 28} ${y - 14} C${x + 28} ${y - 30}, ${x + 16} ${y - 38}, ${x} ${y - 38} C${x - 16} ${y - 38}, ${x - 28} ${y - 30}, ${x - 28} ${y - 14} Z" fill="${P.goldMid}"/>
    <path d="M${x - 18} ${y - 48} Q${x} ${y - 36} ${x + 18} ${y - 48}" fill="none" stroke="${P.brownMid}" stroke-width="3" opacity="0.55"/>
    <circle cx="${x - 9}" cy="${y - 16}" r="2.6" fill="${P.inkNeutral}"/>
    <circle cx="${x + 9}" cy="${y - 16}" r="2.6" fill="${P.inkNeutral}"/>
    <path d="M${x - 8} ${y - 6} Q${x} ${y} ${x + 8} ${y - 6}" fill="none" stroke="${P.inkNeutral}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M${x + 34} ${y + 28} L${x + 58} ${y + 8}" stroke="${P.brownLight}" stroke-width="8" stroke-linecap="round"/>
  </g>`;
}

function cloud(x, y, s = 1) {
  return `
  <g fill="${P.cloud}" opacity="0.9">
    <ellipse cx="${x}" cy="${y}" rx="${38 * s}" ry="${16 * s}"/>
    <ellipse cx="${x + 28 * s}" cy="${y - 6 * s}" rx="${24 * s}" ry="${14 * s}"/>
    <ellipse cx="${x - 22 * s}" cy="${y - 4 * s}" rx="${20 * s}" ry="${12 * s}"/>
  </g>`;
}

function heroIllustration() {
  return `<svg width="1600" height="1200" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="${P.sky}"/>
  <circle cx="640" cy="96" r="52" fill="${P.goldLight}"/>
  <circle cx="640" cy="96" r="34" fill="${P.goldMid}" opacity="0.55"/>
  ${cloud(160, 88, 1)}
  ${cloud(430, 70, 0.75)}
  <path d="M0 210 C 140 150, 280 190, 420 155 C 560 120, 680 150, 800 130 L 800 600 L 0 600 Z" fill="${P.greenPale}"/>
  <path d="M0 280 C 170 220, 320 260, 470 225 C 620 190, 720 220, 800 205 L 800 600 L 0 600 Z" fill="${P.greenLight}"/>
  <path d="M0 360 C 190 310, 360 340, 540 305 C 660 280, 730 300, 800 290 L 800 600 L 0 600 Z" fill="${P.greenMid}"/>
  <path d="M0 455 C 220 420, 420 445, 800 410 L 800 600 L 0 600 Z" fill="${P.dirt}"/>
  <path d="M90 470 C 260 500, 480 455, 760 490 L 740 600 L 70 600 Z" fill="${P.dirtDark}" opacity="0.35"/>
  ${palm(92, 455)}
  ${maizeStalk(520, 430, 120)}
  ${maizeStalk(548, 438, 102)}
  ${maizeStalk(576, 426, 128)}
  ${maizeStalk(604, 440, 96)}
  ${farmerFigure(250, 355)}
  <g transform="translate(292, 392)">
    ${crate(0, 22, 200, 78)}
    ${producePile(8, 18)}
    ${qrTag(154, 48, 40)}
  </g>
  <g transform="translate(612, 248)">
    ${phone(0, 0)}
  </g>
  <path d="M702 268 L 742 248" stroke="${P.greenInk}" stroke-width="3" stroke-dasharray="6 6" opacity="0.45"/>
  <path d="M120 120 q 12 -10 24 0" fill="none" stroke="${P.greenInk}" stroke-width="2" opacity="0.25"/>
  <path d="M160 108 q 10 -8 20 0" fill="none" stroke="${P.greenInk}" stroke-width="2" opacity="0.25"/>
</svg>`;
}

function aboutIllustration() {
  return `<svg width="1600" height="1200" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="${P.sky}"/>
  <circle cx="118" cy="92" r="44" fill="${P.goldLight}"/>
  ${cloud(300, 80, 0.85)}
  ${cloud(620, 70, 0.7)}
  <path d="M0 250 C 180 200, 360 230, 800 190 L 800 600 L 0 600 Z" fill="${P.greenPale}"/>
  <path d="M0 340 C 200 300, 420 325, 800 280 L 800 600 L 0 600 Z" fill="${P.greenMid}"/>
  <path d="M0 470 C 260 430, 520 460, 800 430 L 800 600 L 0 600 Z" fill="${P.dirt}"/>
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => maizeStalk(46 + i * 36, 455, 70 + (i % 3) * 12)).join('')}
  ${palm(70, 470)}
  <g transform="translate(390, 150)">
    <rect x="0" y="40" width="220" height="150" rx="8" fill="${P.brownPale}" stroke="${P.brownMid}" stroke-width="4"/>
    <path d="M-16 40 L110 -28 L236 40 Z" fill="${P.greenInk}"/>
    <rect x="28" y="70" width="48" height="70" rx="4" fill="${P.sky}" stroke="${P.brownMid}" stroke-width="3"/>
    <rect x="92" y="70" width="48" height="70" rx="4" fill="${P.sky}" stroke="${P.brownMid}" stroke-width="3"/>
    <rect x="156" y="70" width="36" height="70" rx="4" fill="${P.greenLight}" opacity="0.7"/>
    <circle cx="174" cy="102" r="10" fill="${P.greenMid}"/>
  </g>
  <g transform="translate(430, 330)">
    ${crate(0, 30, 170, 70)}
    ${producePile(-6, 24)}
    ${qrTag(128, 52, 36)}
  </g>
  <g transform="translate(640, 210)">
    <rect x="0" y="0" width="120" height="86" rx="12" fill="${P.inkNeutral}"/>
    <rect x="8" y="8" width="104" height="70" rx="6" fill="${P.cream}"/>
    <circle cx="60" cy="40" r="18" fill="${P.greenMid}"/>
    <path d="M60 40 C52 32, 52 24, 60 18 C68 24, 68 32, 60 40 Z" fill="${P.greenLight}"/>
    <path d="M48 58 h24" stroke="${P.greenInk}" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g transform="translate(300, 365)">
    <path d="M-28 95 C-28 40, -12 28, 0 28 C12 28, 28 40, 28 95 Z" fill="${P.shirtNavy}"/>
    <rect x="-8" y="16" width="16" height="16" rx="5" fill="${P.brownLight}"/>
    <circle cx="0" cy="-8" r="22" fill="${P.brownLight}"/>
    <path d="M-22 -4 C-26 -36, -8 -44, 0 -44 C8 -44, 26 -36, 22 -4 C22 -18, 12 -24, 0 -24 C-12 -24, -22 -18, -22 -4 Z" fill="${P.inkNeutral}"/>
    <circle cx="-7" cy="-8" r="2.2" fill="${P.inkNeutral}"/>
    <circle cx="7" cy="-8" r="2.2" fill="${P.inkNeutral}"/>
    <path d="M-6 2 Q0 8 6 2" fill="none" stroke="${P.inkNeutral}" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`;
}

function avatar({ bg, hair, collar, skin, extra = '' }) {
  return `<svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="100" fill="${bg}"/>
  <path d="M38 200 C38 142, 62 124, 100 124 C138 124, 162 142, 162 200 Z" fill="${collar}"/>
  <rect x="82" y="108" width="36" height="28" rx="10" fill="${skin}"/>
  <circle cx="100" cy="82" r="44" fill="${skin}"/>
  ${hair}
  ${extra}
  <circle cx="85" cy="86" r="4.2" fill="${P.inkNeutral}"/>
  <circle cx="115" cy="86" r="4.2" fill="${P.inkNeutral}"/>
  <path d="M86 102 Q100 112 114 102" stroke="${P.inkNeutral}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
</svg>`;
}

const farmerHair = `
  <path d="M52 92 C46 36, 70 20, 100 20 C130 20, 154 36, 148 92 C148 70, 142 54, 128 48 C134 66, 132 76, 124 82 C124 56, 114 44, 100 44 C86 44, 76 56, 76 82 C68 76, 66 66, 72 48 C58 54, 52 70, 52 92 Z" fill="${P.goldMid}"/>
  <path d="M72 48 Q100 62 128 48" fill="none" stroke="${P.brownMid}" stroke-width="4" opacity="0.5"/>
  <circle cx="54" cy="96" r="5" fill="${P.goldLight}"/>
`;

const buyerHair = `
  <path d="M54 90 C48 38, 70 26, 100 26 C130 26, 152 38, 146 90 C146 58, 138 44, 100 44 C62 44, 54 58, 54 90 Z" fill="${P.inkNeutral}"/>
  <path d="M78 124 L100 148 L122 124 Z" fill="${P.cream}"/>
`;

const agentHair = `
  <path d="M56 86 C52 48, 70 34, 100 34 C130 34, 148 48, 144 86 C144 64, 132 54, 100 54 C68 54, 56 64, 56 86 Z" fill="${P.inkNeutral}"/>
  <ellipse cx="100" cy="40" rx="40" ry="16" fill="${P.brownMid}"/>
  <ellipse cx="100" cy="34" rx="28" ry="10" fill="${P.goldMid}"/>
`;

const targets = [
  { name: 'illustration-hero.png', svg: heroIllustration(), width: 1600, height: 1200 },
  { name: 'illustration-about.png', svg: aboutIllustration(), width: 1600, height: 1200 },
  {
    name: 'illustration-avatar-farmer.png',
    svg: avatar({ bg: P.goldPale, hair: farmerHair, collar: P.greenMid, skin: P.brownLight }),
    width: 400, height: 400,
  },
  {
    name: 'illustration-avatar-buyer.png',
    svg: avatar({ bg: P.greenPale, hair: buyerHair, collar: P.shirtNavy, skin: P.brownLight }),
    width: 400, height: 400,
  },
  {
    name: 'illustration-avatar-agent.png',
    svg: avatar({ bg: P.brownPale, hair: agentHair, collar: P.brownMid, skin: P.brownLight }),
    width: 400, height: 400,
  },
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(DESIGN_COPY, { recursive: true });
  for (const t of targets) {
    const buf = await sharp(Buffer.from(t.svg)).resize(t.width, t.height).png().toBuffer();
    fs.writeFileSync(path.join(OUT_DIR, t.name), buf);
    fs.writeFileSync(path.join(DESIGN_COPY, t.name), buf);
    console.log(`Generated ${t.name} (${t.width}x${t.height})`);
  }
}

run().catch((err) => {
  console.error('Error generating illustrations:', err);
  process.exit(1);
});
