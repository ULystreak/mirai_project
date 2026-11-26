import { describe, expect, it } from 'vitest';
import { PACKAGES, estimateHours } from '../src/data/catalog.js';
import {
  acceptOrder,
  addDelivery,
  approveOrder,
  completeStage,
  createOrder,
  currentStage,
  deliverOrder,
  eta,
  orderStatus,
  progress,
  rejectOrder,
  requestAdjustment,
  setStageDeadline,
} from '../src/lib/orders.js';

const now = new Date(2026, 10, 30, 10, 0); // segunda-feira, 10h

const newOrder = () =>
  createOrder(
    {
      id: 'p1',
      clientId: 'c1',
      business: { name: 'Padaria' },
      identity: {},
      pkg: PACKAGES[1], // Essencial: 8 posts
      posts: Array.from({ length: 8 }, (_, i) => ({ id: String(i), type: 'Produto', brief: 'Post de teste' })),
      materials: [],
      dueWanted: null,
    },
    now,
  );

const delivery = { id: 'd1', name: 'arte.png', blobKey: 'k1', caption: '', hashtags: '', suggestedDate: '' };

describe('horas e previsão', () => {
  it('8 posts somam 27 h úteis', () => {
    expect(estimateHours(8)).toBe(27);
  });

  it('nasce novo, com o recebimento concluído', () => {
    const o = newOrder();
    expect(orderStatus(o)).toBe('novo');
    expect(progress(o)).toBeCloseTo(1 / 6);
  });

  it('previsão segue as 27 h úteis: segunda 10h até quinta 10h', () => {
    expect(eta(newOrder())).toEqual(new Date(2026, 11, 3, 10, 0));
  });
});

describe('fluxo do pedido', () => {
  it('aceitar leva para produção e atribui o parceiro', () => {
    const o = acceptOrder(newOrder(), 'parceiro-1', now);
    expect(orderStatus(o)).toBe('producao');
    expect(o.assigneeId).toBe('parceiro-1');
  });

  it('não conclui etapa antes de aceitar', () => {
    expect(() => completeStage(newOrder(), now)).toThrow('não pode ser concluída');
  });

  it('conclui etapas em ordem', () => {
    const aceito = acceptOrder(newOrder(), 'p', now);
    expect(currentStage(aceito).key).toBe('edicao');
    expect(currentStage(completeStage(aceito, now)).key).toBe('legendas');
  });

  it('recusa exige motivo', () => {
    expect(() => rejectOrder(newOrder(), 'curto', now)).toThrow('10 caracteres');
    expect(orderStatus(rejectOrder(newOrder(), 'Fora da nossa área de atendimento', now))).toBe('recusado');
  });

  it('entrega final exige etapas anteriores e pelo menos uma arte', () => {
    let o = acceptOrder(newOrder(), 'p', now);
    o = completeStage(completeStage(completeStage(o, now), now), now);
    expect(currentStage(o).key).toBe('entrega');
    expect(() => deliverOrder(o, now)).toThrow('Envie pelo menos uma arte');
    o = deliverOrder(addDelivery(o, delivery, now), now);
    expect(orderStatus(o)).toBe('aguardando');
    expect(orderStatus(approveOrder(o, now))).toBe('concluido');
  });

  it('pedido de ajuste volta para a edição', () => {
    let o = acceptOrder(newOrder(), 'p', now);
    o = completeStage(completeStage(completeStage(o, now), now), now);
    o = deliverOrder(addDelivery(o, delivery, now), now);
    const ajuste = requestAdjustment(o, 'Trocar a cor do fundo', now);
    expect(orderStatus(ajuste)).toBe('producao');
    expect(currentStage(ajuste).key).toBe('edicao');
    expect(ajuste.adjusting).toBe(true);
  });

  it('prazo editado à mão vira âncora para as etapas seguintes', () => {
    const o = setStageDeadline(acceptOrder(newOrder(), 'p', now), 'legendas', new Date(2026, 11, 2, 18).toISOString(), now);
    // legendas fica na quarta 18h; revisão 2 h e entrega 1 h dão quinta às 12h
    expect(eta(o)).toEqual(new Date(2026, 11, 3, 12, 0));
    expect(o.stages.find((s) => s.key === 'legendas').manual).toBe(true);
  });
});
