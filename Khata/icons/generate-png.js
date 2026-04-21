const fs = require('fs');
const path = require('path');

function createIcon(size) {
  const canvas = Buffer.alloc(size * size * 4 + size * size * 4 + 100);
  const width = size;
  const height = size;
  
  const pixels = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = hexToRgb('#020617');
      pixels.push(px.r, px.g, px.b, 255);
    }
  }
  
  const inset = Math.floor(size * 0.06);
  const radius = Math.floor(size * 0.15);
  const innerSize = size - inset * 2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      if (x >= inset && x < size - inset && y >= inset && y < size - inset) {
        const cx = x - inset;
        const cy = y - inset;
        
        let inRoundedRect = false;
        if (cx >= radius && cx < innerSize - radius) {
          inRoundedRect = true;
        } else if (cy >= radius && cy < innerSize - radius) {
          inRoundedRect = true;
        } else {
          const dx = Math.max(0, radius - cx, cx - (innerSize - radius));
          const dy = Math.max(0, radius - cy, cy - (innerSize - radius));
          if (dx * dx + dy * dy <= radius * radius) {
            inRoundedRect = true;
          }
        }
        
        if (inRoundedRect) {
          const teal = hexToRgb('#00ffd0');
          pixels[idx] = teal.r;
          pixels[idx + 1] = teal.g;
          pixels[idx + 2] = teal.b;
        }
      }
      
      if (x >= inset + 10 && x < size - inset - 10 && y >= inset + 10 && y < size - inset - 10) {
        const fontSize = Math.floor(size * 0.5);
        const centerX = size / 2;
        const centerY = size / 2;
        
        const dist = Math.abs(x - centerX);
        const distY = Math.abs(y - centerY);
        
        if (dist < fontSize * 0.35 && distY < fontSize * 0.5) {
          const dark = hexToRgb('#020617');
          pixels[idx] = dark.r;
          pixels[idx + 1] = dark.g;
          pixels[idx + 2] = dark.b;
        }
      }
    }
  }
  
  return createPNG(width, height, Buffer.from(pixels));
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function createPNG(width, height, pixels) {
  const crc32 = (data) => {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  
  const deflate = (data) => {
    const result = [];
    result.push(0x78, 0x01);
    
    for (let i = 0; i < data.length; i += 65535) {
      const chunk = data.slice(i, i + 65535);
      const isLast = i + 65535 >= data.length;
      result.push(isLast ? 1 : 0);
      result.push(chunk.length & 0xff, (chunk.length >> 8) & 0xff);
      result.push(~chunk.length & 0xff, (~chunk.length >> 8) & 0xff);
      result.push(...chunk);
    }
    
    let adler = 1;
    for (let i = 0; i < data.length; i++) {
      adler = (adler + data[i]) % 65521;
    }
    result.push((adler >> 24) & 0xff, (adler >> 16) & 0xff, (adler >> 8) & 0xff, adler & 0xff);
    
    return Buffer.from(result);
  };
  
  const makeChunk = (type, data) => {
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  };
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const out = y * (1 + width * 4) + 1 + x * 4;
      raw[out] = pixels[idx + 2];
      raw[out + 1] = pixels[idx + 1];
      raw[out + 2] = pixels[idx];
      raw[out + 3] = pixels[idx + 3];
    }
  }
  
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflate(raw)),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
  
  return png;
}

const iconsDir = path.join(__dirname);
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createIcon(512));

console.log('Icons created: icon-192.png, icon-512.png');