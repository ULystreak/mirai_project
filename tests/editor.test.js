import { describe, expect, it } from 'vitest';
import { applyAdjust, coverRect } from '../src/lib/editor.js';

describe('coverRect', () => {
  it('não deixa vazio ao arrastar além da borda', () => {
    const r = coverRect(2000, 1000, 1000, 1000, 1, 9999, 0);
    expect(r.x).toBeCloseTo(0);
    expect(r.w).toBe(2000);
    expect(r.h).toBe(1000);
  });

  it('zoom aumenta a imagem', () => {
    expect(coverRect(1000, 1000, 1000, 1000, 2).w).toBe(2000);
  });
});

describe('applyAdjust', () => {
  it('brilho +100 leva o preto ao branco', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 255]);
    applyAdjust(data, { brightness: 100 });
    expect(Array.from(data.slice(0, 3))).toEqual([255, 255, 255]);
  });

  it('saturação -100 deixa a cor cinza', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    applyAdjust(data, { saturation: -100 });
    expect(Math.abs(data[0] - data[1])).toBeLessThanOrEqual(1);
    expect(Math.abs(data[1] - data[2])).toBeLessThanOrEqual(1);
  });
});
