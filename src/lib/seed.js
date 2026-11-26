import { PACKAGES, POST_TYPES } from '../data/catalog.js';
import { acceptOrder, completeStage, createOrder } from './orders.js';
import { putBlob } from './media.js';
import { setState, uid } from './store.js';

// Arte de exemplo gerada em código. Não é foto real e aparece rotulada como exemplo.
export async function sampleArt(label, [h1, h2]) {
  await document.fonts.load('700 120px "Bricolage Grotesque Variable"');
  const canvas = Object.assign(document.createElement('canvas'), { width: 1080, height: 1350 });
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
  grad.addColorStop(0, `hsl(${h1} 70% 45%)`);
  grad.addColorStop(1, `hsl(${h2} 65% 22%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.arc(820, 300, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E9F0FF';
  ctx.font = '700 120px "Bricolage Grotesque Variable", sans-serif';
  ctx.fillText(label, 90, 1150);
  ctx.font = '400 40px "Inter Variable", sans-serif';
  ctx.fillText('exemplo gerado no navegador', 90, 1230);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// Dois pedidos de exemplo: um novo e um já em produção, para a equipe ver algo de imediato.
export async function addSampleOrders() {
  const now = new Date();
  const specs = [
    { name: 'Helena Prado', email: 'helena@exemplo.com', business: 'Padaria Trigo & Mel', pkg: PACKAGES[0], accept: false, hues: [28, 8] },
    { name: 'Rafael Lima', email: 'rafael@exemplo.com', business: 'Studio Lua Barbearia', pkg: PACKAGES[1], accept: true, hues: [260, 290] },
  ];
  const clients = [];
  const orders = [];
  for (const sp of specs) {
    const clientId = uid();
    const materials = [];
    for (const part of ['logo', 'produto']) {
      const blobKey = uid();
      await putBlob(blobKey, await sampleArt(`${sp.business.split(' ')[0]} · ${part}`, sp.hues));
      materials.push({ id: uid(), name: `exemplo-${part}.png`, type: 'image/png', blobKey, width: 1080, height: 1350, createdAt: now.toISOString() });
    }
    const posts = Array.from({ length: sp.pkg.posts }, (_, i) => ({
      id: uid(),
      type: POST_TYPES[i % POST_TYPES.length],
      brief: 'Post de exemplo: destaque do produto da semana.',
    }));
    let order = createOrder(
      {
        id: uid(),
        clientId,
        business: { name: sp.business, segment: 'Alimentação', city: 'São Paulo', whatsapp: '(11) 90000-0000', instagram: '@exemplo', site: '', hours: 'Terça a domingo, 8h às 19h' },
        identity: { colors: ['#143A7A'], styles: ['Moderno'], tone: 'Acolhedor e direto', keywords: 'pão artesanal, mel', avoid: 'promoções agressivas' },
        pkg: sp.pkg,
        posts,
        materials,
        dueWanted: null,
      },
      now,
    );
    if (sp.accept) order = completeStage(acceptOrder(order, null, now), now);
    clients.push({ id: clientId, name: sp.name, email: sp.email, businessName: sp.business, passwordHash: '', createdAt: now.toISOString() });
    orders.push(order);
  }
  setState((s) => ({ ...s, clients: [...s.clients, ...clients], orders: [...s.orders, ...orders] }));
}
