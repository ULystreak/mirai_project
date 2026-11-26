import { describe, expect, it } from 'vitest';
import { addBusinessHours, countdown } from '../src/lib/time.js';

const at = (y, mo, d, h = 0, mi = 0) => new Date(y, mo - 1, d, h, mi);

describe('addBusinessHours', () => {
  it('soma dentro do mesmo dia', () => {
    expect(addBusinessHours(at(2026, 11, 30, 10), 4)).toEqual(at(2026, 11, 30, 14));
  });

  it('continua no dia seguinte quando o expediente acaba', () => {
    expect(addBusinessHours(at(2026, 11, 30, 17), 2)).toEqual(at(2026, 12, 1, 10));
  });

  it('pula o fim de semana (sexta 17h + 2h cai na segunda)', () => {
    expect(addBusinessHours(at(2026, 12, 4, 17), 2)).toEqual(at(2026, 12, 7, 10));
  });

  it('começa na segunda quando a data é sábado', () => {
    expect(addBusinessHours(at(2026, 12, 5, 10), 1)).toEqual(at(2026, 12, 7, 10));
  });
});

describe('countdown', () => {
  it('mostra o tempo que falta em dias e horas', () => {
    expect(countdown(at(2026, 11, 28, 18), at(2026, 11, 26, 14))).toBe('faltam 2 d 4 h');
  });

  it('mostra quanto tempo já passou do prazo', () => {
    expect(countdown(at(2026, 11, 26, 10), at(2026, 11, 26, 13, 30))).toBe('atrasado há 3 h 30 min');
  });
});
