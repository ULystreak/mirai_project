import { Link } from 'react-router';
import { Revelacao } from './Revelacao.jsx';
import { Bar, StatusPill } from './ui.jsx';
import { useBlobUrl } from '../lib/media.js';
import { STATUS, currentStage, eta, orderStatus, progress } from '../lib/orders.js';
import { when } from '../lib/format.js';
import { countdown } from '../lib/time.js';

// Cartão do pedido: a primeira arte do cliente se revela conforme as etapas avançam.
export function OrderCard({ order, to, now }) {
  const url = useBlobUrl(order.materials[0]?.blobKey);
  const st = orderStatus(order);
  const cur = currentStage(order);
  const e = eta(order);
  const ativo = st === 'novo' || st === 'producao';
  return (
    <Link to={to} className="order-card">
      <Revelacao src={url} progress={progress(order)} label={`Progresso de ${order.business.name}`} />
      <div className="order-card__body">
        <StatusPill status={st} label={STATUS[st]} />
        <h2 className="order-card__name">{order.business.name}</h2>
        <p className="order-card__stage">{cur ? cur.label : 'Tudo entregue'}</p>
        <Bar value={progress(order)} label="Progresso do pedido" />
        {ativo && e && <p className="order-card__eta num">Previsão: {when(e)} · {countdown(e, now)}</p>}
      </div>
    </Link>
  );
}
