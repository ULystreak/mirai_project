import { describe, expect, it } from 'vitest';
import { crc32, zipBytes } from '../src/lib/zip.js';

const join = (chunks) => {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
};

describe('crc32', () => {
  it('bate com o vetor conhecido "123456789"', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('zipBytes', () => {
  it('monta assinatura local no início e de fim de diretório no final', () => {
    const zip = join(zipBytes([{ name: 'a.txt', data: new TextEncoder().encode('abc') }]));
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(Array.from(zip.slice(-22, -18))).toEqual([0x50, 0x4b, 0x05, 0x06]);
    expect(new TextDecoder().decode(zip)).toContain('abc');
  });
});
