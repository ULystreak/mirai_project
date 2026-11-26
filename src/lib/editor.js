import { TEXT_FONTS } from '../data/catalog.js';

export const FORMATS = { '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920], original: null };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Retângulo que cobre a moldura, com zoom e deslocamento limitados para não aparecer vazio.
export function coverRect(imgW, imgH, frameW, frameH, zoom = 1, panX = 0, panY = 0) {
  const s = Math.max(frameW / imgW, frameH / imgH) * zoom;
  const w = imgW * s;
  const h = imgH * s;
  const maxX = Math.max(0, (w - frameW) / 2);
  const maxY = Math.max(0, (h - frameH) / 2);
  return {
    x: (frameW - w) / 2 + clamp(panX, -maxX, maxX),
    y: (frameH - h) / 2 + clamp(panY, -maxY, maxY),
    w,
    h,
  };
}

// Brilho, contraste e saturação em -100..100, feitos pixel a pixel (funciona no Safari também).
export function applyAdjust(data, { brightness = 0, contrast = 0, saturation = 0 }) {
  const b = (brightness * 255) / 100;
  const c = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const s = 1 + saturation / 100;
  for (let i = 0; i < data.length; i += 4) {
    const r = c * (data[i] + b - 128) + 128;
    const g = c * (data[i + 1] + b - 128) + 128;
    const bl = c * (data[i + 2] + b - 128) + 128;
    const gray = 0.299 * r + 0.587 * g + 0.114 * bl;
    data[i] = gray + (r - gray) * s;
    data[i + 1] = gray + (g - gray) * s;
    data[i + 2] = gray + (bl - gray) * s;
  }
  return data;
}

function wrap(ctx, text, maxW) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxW) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

// Escreve o texto centralizado em (x, y), frações da arte. Devolve a caixa ocupada, para arrastar.
export function drawText(ctx, text, { size, color, family, pill, x, y }) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const px = Math.round(size * W);
  ctx.font = `700 ${px}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrap(ctx, text, W * 0.84);
  const lh = px * 1.15;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const cx = x * W;
  const top = y * H - ((lines.length - 1) * lh) / 2;
  const box = { x: cx - widest / 2 - px * 0.4, y: top - lh / 2 - px * 0.2, w: widest + px * 0.8, h: lines.length * lh + px * 0.4 };
  if (pill) {
    ctx.fillStyle = 'rgba(6, 11, 30, 0.72)';
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, px * 0.3);
    ctx.fill();
  }
  ctx.fillStyle = color;
  lines.forEach((l, i) => ctx.fillText(l, cx, top + i * lh));
  return box;
}

// Monta a arte (ou a prévia, com `maxW`) num canvas. Zoom e deslocamento são frações do quadro.
export function renderArt({ img, format, zoom, panX, panY, adjust, text, maxW }) {
  const [fw, fh] = FORMATS[format] ?? [img.width, img.height];
  const k = maxW ? maxW / fw : 1;
  const W = Math.round(fw * k);
  const H = Math.round(fh * k);
  const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = canvas.getContext('2d');
  const r = coverRect(img.width, img.height, W, H, zoom, panX * W, panY * H);
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  const pixels = ctx.getImageData(0, 0, W, H);
  applyAdjust(pixels.data, adjust);
  ctx.putImageData(pixels, 0, 0);
  let box = null;
  if (text?.value) {
    const family = TEXT_FONTS.find((f) => f.id === text.font)?.family ?? TEXT_FONTS[0].family;
    box = drawText(ctx, text.value, { ...text, family });
  }
  return { canvas, box };
}

export const toBlob = (canvas, type = 'image/png') => new Promise((resolve) => canvas.toBlob(resolve, type, 0.92));
