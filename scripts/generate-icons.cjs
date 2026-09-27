const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure public directory exists
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  buf.writeUInt32BE(crc32(typeAndData), 8 + len);
  return buf;
}

function createPng(width, height, drawFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatCompressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// BGMI Tactical Icon Art
function drawTacticalIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.hypot(x - cx, y - cy);
  const maxR = w / 2;

  // Background
  let bgR = 10, bgG = 12, bgB = 16, bgA = 255; // #0a0c10

  // Corner rounding if not maskable
  if (!isMaskable) {
    const cornerRadius = w * 0.22;
    const dx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
    const dy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
    if (Math.hypot(dx, dy) > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside rounded squircle
    }
  }

  // Radial subtle gradient
  const grad = 1 - Math.min(1, r / (maxR * 1.2));
  bgR = Math.min(255, Math.floor(bgR + 15 * grad));
  bgG = Math.min(255, Math.floor(bgG + 35 * grad));
  bgB = Math.min(255, Math.floor(bgB + 25 * grad));

  // Outer glowing ring
  const ringR = w * (isMaskable ? 0.38 : 0.42);
  const ringDist = Math.abs(r - ringR);
  if (ringDist < w * 0.02) {
    const alphaFactor = 1 - ringDist / (w * 0.02);
    return [
      Math.floor(16 * (1 - alphaFactor) + 16 * alphaFactor),
      Math.floor(185 * alphaFactor + bgG * (1 - alphaFactor)),
      Math.floor(129 * alphaFactor + bgB * (1 - alphaFactor)),
      255
    ];
  }

  // Crosshair lines
  const lineThick = Math.max(1, w * 0.015);
  const isCrosshair = (Math.abs(x - cx) < lineThick && (y < cy - ringR * 0.6 || y > cy + ringR * 0.6) && r < ringR) ||
                      (Math.abs(y - cy) < lineThick && (x < cx - ringR * 0.6 || x > cx + ringR * 0.6) && r < ringR);
  if (isCrosshair) {
    return [16, 185, 129, 255]; // emerald 500
  }

  // Tactical Helmet / Crest Silhouette in Center
  const nx = (x - cx) / (w * (isMaskable ? 0.28 : 0.32));
  const ny = (y - cy) / (h * (isMaskable ? 0.28 : 0.32));

  // Helmet Dome (upper half ellipse)
  if (ny < 0.2 && (nx * nx + (ny + 0.1) * (ny + 0.1) * 1.5) < 0.7) {
    // Visor slit
    if (ny > -0.15 && ny < 0.05 && Math.abs(nx) < 0.7) {
      // Emerald visor glow
      return [52, 211, 153, 255]; // emerald 400
    }
    // Dark metallic helmet
    return [39, 39, 42, 255]; // zinc 800
  }

  // Helmet Jawguard
  if (ny >= 0.2 && ny < 0.75 && Math.abs(nx) < 0.55 - (ny - 0.2) * 0.35) {
    // Center vent grill
    if (Math.abs(nx) < 0.15 && Math.floor(ny * 20) % 2 === 0) {
      return [16, 185, 129, 255]; // emerald grill accent
    }
    return [24, 24, 27, 255]; // zinc 900
  }

  // Star / Squad badge emblem on forehead
  if (Math.hypot(nx, ny + 0.45) < 0.18) {
    return [245, 158, 11, 255]; // amber 500 star
  }

  return [bgR, bgG, bgB, bgA];
}

// Generate files
const sizes = [
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon.ico', size: 64, maskable: false },
];

for (const s of sizes) {
  const filePath = path.join(publicDir, s.name);
  const pngBuf = createPng(s.size, s.size, (x, y, w, h) => drawTacticalIcon(x, y, w, h, s.maskable));
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Generated ${s.name} (${s.size}x${s.size})`);
}

// SVG Vector Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#142e23"/>
      <stop offset="70%" stop-color="#090d0b"/>
      <stop offset="100%" stop-color="#040605"/>
    </radialGradient>
    <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="110" fill="url(#bgGrad)"/>
  
  <!-- Outer Tactical Target Ring -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="#10b981" stroke-width="6" opacity="0.75" filter="url(#glow)"/>
  <circle cx="256" cy="256" r="170" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="10 14" opacity="0.4"/>
  
  <!-- Crosshairs -->
  <line x1="256" y1="26" x2="256" y2="76" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>
  <line x1="256" y1="436" x2="256" y2="486" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>
  <line x1="26" y1="256" x2="76" y2="256" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>
  <line x1="436" y1="256" x2="486" y2="256" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>

  <!-- Helmet / Shield Shape -->
  <path d="M 256 110 C 180 110 140 160 140 230 C 140 290 170 360 256 410 C 342 360 372 290 372 230 C 372 160 332 110 256 110 Z" 
        fill="url(#shieldGrad)" stroke="#3f3f46" stroke-width="6" />

  <!-- Visor -->
  <path d="M 168 220 L 344 220 C 344 250 320 270 256 270 C 192 270 168 250 168 220 Z" 
        fill="url(#emeraldGrad)" filter="url(#glow)"/>

  <!-- Gold Crest Star -->
  <polygon points="256,135 264,152 283,154 269,167 273,186 256,177 239,186 243,167 229,154 248,152" fill="#f59e0b"/>

  <!-- Lower Tactical Mouth Grate Lines -->
  <line x1="236" y1="310" x2="276" y2="310" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
  <line x1="242" y1="326" x2="270" y2="326" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
  <line x1="248" y1="342" x2="264" y2="342" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Generated icon.svg');
