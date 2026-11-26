import { describe, expect, it } from 'vitest';
import { generatePassword, sha256 } from '../src/lib/auth.js';

describe('sha256', () => {
  it('bate com o vetor conhecido de "abc"', async () => {
    expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('generatePassword', () => {
  it('tem 10 caracteres sem letras ambíguas (i, l, o) nem 0 e 1', () => {
    expect(generatePassword()).toMatch(/^[a-hj-km-np-z2-9]{10}$/);
  });
});
