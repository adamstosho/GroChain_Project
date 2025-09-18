const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create logos directory if it doesn't exist
const logosDir = path.join(__dirname, '../public/logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// SVG content for the icon
const iconSvg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16a34a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:0.8" />
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <circle cx="32" cy="32" r="30" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  
  <path d="M20 25 C20 18, 26 15, 32 18 C38 21, 42 28, 40 35 C38 42, 32 45, 26 42 C20 39, 16 32, 20 25 Z" 
        fill="url(#leafGradient)" 
        stroke="#15803d" 
        stroke-width="1.5"/>
  
  <path d="M24 25 L28 32 M28 22 L32 28 M32 19 L36 25" 
        stroke="#15803d" 
        stroke-width="1.5" 
        stroke-linecap="round" 
        opacity="0.8"/>
  
  <g transform="translate(20, 45)">
    <ellipse cx="4" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" stroke-width="1.5"/>
    <ellipse cx="4" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" stroke-width="1"/>
    <ellipse cx="10" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" stroke-width="1.5"/>
    <ellipse cx="10" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" stroke-width="1"/>
    <ellipse cx="16" cy="4" rx="3" ry="2" fill="none" stroke="url(#chainGradient)" stroke-width="1.5"/>
    <ellipse cx="16" cy="4" rx="2" ry="1.2" fill="none" stroke="url(#chainGradient)" stroke-width="1"/>
    <line x1="7" y1="4" x2="7" y2="4" stroke="url(#chainGradient)" stroke-width="1.5"/>
    <line x1="13" y1="4" x2="13" y2="4" stroke="url(#chainGradient)" stroke-width="1.5"/>
  </g>
  
  <g transform="translate(20, 20)">
    <rect x="0" y="0" width="2" height="2" fill="url(#qrGradient)"/>
    <rect x="3" y="0" width="1" height="1" fill="url(#qrGradient)"/>
    <rect x="5" y="0" width="2" height="2" fill="url(#qrGradient)"/>
    <rect x="0" y="3" width="1" height="1" fill="url(#qrGradient)"/>
    <rect x="2" y="3" width="1" height="1" fill="url(#qrGradient)"/>
    <rect x="4" y="3" width="1" height="1" fill="url(#qrGradient)"/>
    <rect x="6" y="3" width="1" height="1" fill="url(#qrGradient)"/>
    <rect x="0" y="5" width="2" height="2" fill="url(#qrGradient)"/>
    <rect x="3" y="5" width="1" height="1" fill="url(#qrGradient)"/>
    <rect x="5" y="5" width="2" height="2" fill="url(#qrGradient)"/>
    <rect x="0" y="0" width="2" height="2" fill="none" stroke="url(#qrGradient)" stroke-width="0.5"/>
    <rect x="5" y="0" width="2" height="2" fill="none" stroke="url(#qrGradient)" stroke-width="0.5"/>
    <rect x="0" y="5" width="2" height="2" fill="none" stroke="url(#qrGradient)" stroke-width="0.5"/>
  </g>
  
  <line x1="20" y1="25" x2="28" y2="25" stroke="#10b981" stroke-width="1" opacity="0.7" filter="url(#glow)">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
  </line>
</svg>`;

async function generateLogos() {
  try {
    console.log('Generating logo variants...');
    
    // Generate different sizes for app icons
    const sizes = [
      { size: 16, name: 'favicon-16x16.png' },
      { size: 32, name: 'favicon-32x32.png' },
      { size: 192, name: 'icon-192x192.png' },
      { size: 512, name: 'icon-512x512.png' },
      { size: 180, name: 'apple-touch-icon.png' }
    ];
    
    for (const { size, name } of sizes) {
      await sharp(Buffer.from(iconSvg))
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, '../public', name));
      
      console.log(`Generated ${name} (${size}x${size})`);
    }
    
    // Generate favicon.ico (16x16)
    await sharp(Buffer.from(iconSvg))
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    
    console.log('Generated favicon.ico');
    
    // Generate full logo variants
    const fullLogoSvg = fs.readFileSync(path.join(__dirname, '../public/logo.svg'), 'utf8');
    
    await sharp(Buffer.from(fullLogoSvg))
      .resize(200, 60)
      .png()
      .toFile(path.join(logosDir, 'logo-200x60.png'));
    
    await sharp(Buffer.from(fullLogoSvg))
      .resize(400, 120)
      .png()
      .toFile(path.join(logosDir, 'logo-400x120.png'));
    
    console.log('Generated full logo variants');
    console.log('Logo generation completed successfully!');
    
  } catch (error) {
    console.error('Error generating logos:', error);
  }
}

generateLogos();
