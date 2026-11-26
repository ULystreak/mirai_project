import { STAGES } from '../data/catalog.js';
import { addBusinessHours } from './time.js';

export const STATUS = {
  novo: 'Novo',
  producao: 'Em produção',
  aguardando: 'Aguardando sua aprovação',
  concluido: 'Concluído',
  recusado: 'Recusado',
};

const iso = (d = new Date()) => new Date(d).toISOString();
const fail = (msg) => {
  throw new Error(msg);
};
const find = (o, key) => o.stages.find((s) => s.key === key);
const clone = (o) => structuredClone(o);
const log = (o, text, now) => ({ ...o, events: [...o.events, { at: iso(now), text }], updatedAt: iso(now) });

// Recalcula os prazos das etapas em aberto, a partir de `now`. Prazo editado à mão vira âncora.
function schedule(o, now) {
  let cursor = new Date(now);
  for (const s of o.stages) {
    if (s.doneAt) continue;
    if (s.manual && s.deadline) {
      cursor = new Date(s.deadline);
      continue;
    }
    s.deadline = addBusinessHours(cursor, s.hours).toISOString();
    cursor = new Date(s.deadline);
  }
  return o;
}

export function createOrder({ id, clientId, business, identity, pkg, posts, materials, dueWanted }, now = new Date()) {
  const stages = STAGES.map((d) => ({
    key: d.key,
    label: d.label,
    message: d.message,
    hours: d.hours(posts.length),
    deadline: null,
    manual: false,
    doneAt: null,
  }));
  find({ stages }, 'recebido').doneAt = iso(now);
  const o = {
    id,
    clientId,
    business,
    identity,
    packageId: pkg.id,
    packageName: pkg.name,
    postsTotal: pkg.posts,
    price: pkg.price,
    posts,
    materials,
    stages,
    assigneeId: null,
    rejectedAt: null,
    rejectionReason: '',
    deliveries: [],
    deliveredAt: null,
    approvedAt: null,
    adjusting: false,
    adjustmentNote: '',
    dueWanted,
    createdAt: iso(now),
    updatedAt: iso(now),
    events: [],
  };
  return log(schedule(o, now), 'Pedido enviado pelo cliente.', now);
}

export function orderStatus(o) {
  if (o.rejectedAt) return 'recusado';
  if (o.approvedAt) return 'concluido';
  if (o.deliveredAt) return 'aguardando';
  return find(o, 'aceito').doneAt ? 'producao' : 'novo';
}

export const currentStage = (o) => o.stages.find((s) => !s.doneAt) ?? null;
export const progress = (o) => o.stages.filter((s) => s.doneAt).length / o.stages.length;
export const eta = (o) => (o.stages.at(-1).deadline ? new Date(o.stages.at(-1).deadline) : null);
export const isLate = (stage, now = new Date()) => !!stage?.deadline && !stage.doneAt && now > new Date(stage.deadline);
export const remainingHours = (o) => o.stages.filter((s) => !s.doneAt).reduce((n, s) => n + s.hours, 0);

export function acceptOrder(o, partnerId, now = new Date()) {
  if (orderStatus(o) !== 'novo') fail('Este pedido já foi aceito ou encerrado.');
  const n = clone(o);
  find(n, 'aceito').doneAt = iso(now);
  n.assigneeId = partnerId;
  return log(schedule(n, now), 'Projeto aceito pela equipe.', now);
}

export function rejectOrder(o, reason, now = new Date()) {
  if (orderStatus(o) !== 'novo') fail('Só dá para recusar pedidos novos.');
  const motivo = reason.trim();
  if (motivo.length < 10) fail('Explique o motivo com pelo menos 10 caracteres.');
  return log({ ...o, rejectedAt: iso(now), rejectionReason: motivo }, `Pedido recusado: ${motivo}`, now);
}

export function completeStage(o, now = new Date()) {
  const cur = currentStage(o);
  if (orderStatus(o) !== 'producao' || !cur || cur.key === 'aceito' || cur.key === 'entrega') {
    fail('Esta etapa não pode ser concluída por aqui.');
  }
  const n = clone(o);
  find(n, cur.key).doneAt = iso(now);
  return log(schedule(n, now), `Etapa concluída: ${cur.label}.`, now);
}

export function setStageDeadline(o, key, isoDate, now = new Date()) {
  const stage = find(o, key);
  if (!stage || stage.doneAt) fail('Só dá para mudar o prazo de etapas em andamento.');
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) fail('Data inválida.');
  const n = clone(o);
  Object.assign(find(n, key), { deadline: date.toISOString(), manual: true });
  return log(schedule(n, now), `Prazo de "${stage.label}" ajustado.`, now);
}

export function requestAdjustment(o, note, now = new Date()) {
  if (orderStatus(o) !== 'aguardando') fail('Só dá para pedir ajuste depois da entrega.');
  const texto = note.trim();
  if (texto.length < 10) fail('Explique o ajuste com pelo menos 10 caracteres.');
  const n = clone(o);
  for (const key of ['entrega', 'revisao', 'legendas', 'edicao']) find(n, key).doneAt = null;
  Object.assign(n, { deliveredAt: null, adjusting: true, adjustmentNote: texto });
  return log(schedule(n, now), `Cliente pediu ajuste: ${texto}`, now);
}

export function deliverOrder(o, now = new Date()) {
  if (orderStatus(o) !== 'producao') fail('Este pedido não está em produção.');
  if (currentStage(o)?.key !== 'entrega') fail('Conclua as etapas anteriores antes da entrega final.');
  if (!o.deliveries.length) fail('Envie pelo menos uma arte antes da entrega final.');
  const n = clone(o);
  Object.assign(find(n, 'entrega'), { doneAt: iso(now) });
  Object.assign(n, { deliveredAt: iso(now), adjusting: false });
  return log(schedule(n, now), 'Entrega final enviada ao cliente.', now);
}

export function approveOrder(o, now = new Date()) {
  if (orderStatus(o) !== 'aguardando') fail('Ainda não há entrega para aprovar.');
  return log({ ...o, approvedAt: iso(now) }, 'Cliente aprovou a entrega. Pedido concluído.', now);
}

export function addDelivery(o, delivery, now = new Date()) {
  if (['recusado', 'concluido'].includes(orderStatus(o))) fail('Este pedido não recebe mais artes.');
  return log({ ...o, deliveries: [...o.deliveries, delivery] }, `Arte enviada: ${delivery.name}`, now);
}

export const assignOrder = (o, partnerId, now = new Date()) => log({ ...o, assigneeId: partnerId }, 'Responsável alterado.', now);
