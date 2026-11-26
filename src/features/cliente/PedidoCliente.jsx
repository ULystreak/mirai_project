import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Download } from 'lucide-react';
import { Arte, Button, Dialog, Empty, Field, StatusPill, useNow, useToast } from '../../components/ui.jsx';
import { Timeline } from '../../components/Timeline.jsx';
import { Revelacao } from '../../components/Revelacao.jsx';
import { currentUser } from '../../lib/auth.js';
import { STATUS, approveOrder, currentStage, eta, orderStatus, progress, remainingHours, requestAdjustment } from '../../lib/orders.js';
import { downloadBlob, getBlob, useBlobUrl } from '../../lib/media.js';
import { patchOrder, useStore } from '../../lib/store.js';
import { zip } from '../../lib/zip.js';
import { when } from '../../lib/format.js';
import { countdown, formatDays, formatHours } from '../../lib/time.js';

// Acompanhamento do cliente: etapa atual, previsão, linha do tempo e entregas.
export function PedidoCliente() {
  const { id } = useParams();
  const user = useStore(currentUser);
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const now = useNow();
  const toast = useToast();
  const [ajustando, setAjustando] = useState(false);
  const primeiraUrl = useBlobUrl(order?.materials[0]?.blobKey);

  if (!order || order.clientId !== user?.id) {
    return (
      <section className="page">
        <Empty title="Não encontramos este pedido.">
          <Link className="btn btn--ghost" to="/cliente">Voltar aos pedidos</Link>
        </Empty>
      </section>
    );
  }

  const st = orderStatus(order);
  const cur = currentStage(order);
  const previsao = eta(order);
  const ativo = st === 'novo' || st === 'producao';
  const restante = remainingHours(order);

  const aprovar = () => {
    try {
      patchOrder(order.id, (o) => approveOrder(o));
      toast('Entrega aprovada. Pedido concluído.');
    } catch (err) {
      toast(err.message, 'error');
    }
  };
  const baixar = async (d) => downloadBlob(await getBlob(d.blobKey), d.name);
  const baixarTudo = async () => {
    const files = await Promise.all(
      order.deliveries.map(async (d) => ({ name: d.name, data: new Uint8Array(await (await getBlob(d.blobKey)).arrayBuffer()) })),
    );
    downloadBlob(zip(files), `${order.business.name}-artes.zip`);
  };

  return (
    <section className="page">
      <header className="order-hero">
        <Revelacao src={primeiraUrl} progress={progress(order)} className="order-hero__art" label="Arte do pedido, revelada conforme o progresso" />
        <div className="order-hero__body">
          <StatusPill status={st} label={STATUS[st]} />
          <h1>{st === 'concluido' ? 'Pedido concluído' : cur ? cur.label : 'Tudo entregue'}</h1>
          {st === 'recusado' && <p className="form-error">Motivo: {order.rejectionReason}</p>}
          {ativo && cur && <p className="lead">{cur.message}</p>}
          {st === 'aguardando' && <p className="lead">Suas artes estão prontas. Confira, baixe e aprove, ou peça um ajuste.</p>}
          {ativo && previsao && (
            <dl className="kv">
              <dt>Previsão de entrega</dt>
              <dd className="num">{when(previsao)}</dd>
              <dt>Quanto falta</dt>
              <dd className="num">{countdown(previsao, now)}</dd>
              <dt>Trabalho restante</dt>
              <dd className="num">
                {formatHours(restante)} · {formatDays(restante)}
              </dd>
            </dl>
          )}
          {order.adjusting && <p className="note">Em ajuste: {order.adjustmentNote}</p>}
          {st === 'aguardando' && (
            <div className="actions">
              <Button onClick={aprovar}>Aprovar entrega</Button>
              <Button variant="ghost" onClick={() => setAjustando(true)}>Pedir ajuste</Button>
            </div>
          )}
          {st === 'recusado' && (
            <Link className="btn btn--primary" to="/cliente/novo">Fazer outro pedido</Link>
          )}
        </div>
      </header>

      <div className="order-grid">
        <section className="section" aria-labelledby="andamento">
          <h2 id="andamento">Andamento</h2>
          <Timeline order={order} now={now} />
        </section>

        <div className="stack">
          {order.deliveries.length > 0 && (
            <section className="section" aria-labelledby="artes">
              <div className="section__head">
                <h2 id="artes">Suas artes</h2>
                {order.deliveries.length > 1 && (
                  <Button variant="ghost" onClick={baixarTudo}>
                    <Download size={18} aria-hidden="true" /> Baixar tudo (.zip)
                  </Button>
                )}
              </div>
              <ul className="arts">
                {order.deliveries.map((d) => (
                  <li key={d.id} className="art">
                    <Arte blobKey={d.blobKey} alt={d.name} />
                    <div className="art__body">
                      <p>{d.name}</p>
                      {d.caption && <p>{d.caption}</p>}
                      {d.hashtags && <p className="muted">{d.hashtags}</p>}
                      {d.suggestedDate && <p className="muted num">Sugestão de postagem: {d.suggestedDate}</p>}
                      <Button variant="ghost" onClick={() => baixar(d)}>
                        <Download size={18} aria-hidden="true" /> Baixar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="section" aria-labelledby="materiais">
            <h2 id="materiais">Materiais enviados</h2>
            <ul className="thumbs">
              {order.materials.map((m) => (
                <li key={m.id} className="thumb">
                  <Arte blobKey={m.blobKey} alt={m.name} />
                  <p className="thumb__name">{m.name}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <AjusteDialog open={ajustando} onClose={() => setAjustando(false)} orderId={order.id} />
    </section>
  );
}

function AjusteDialog({ open, onClose, orderId }) {
  const toast = useToast();
  const [nota, setNota] = useState('');
  const [erro, setErro] = useState('');

  function enviar(e) {
    e.preventDefault();
    try {
      patchOrder(orderId, (o) => requestAdjustment(o, nota));
      setNota('');
      setErro('');
      onClose();
      toast('Pedido de ajuste enviado à equipe.');
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="O que precisa mudar?">
      <form className="dialog__body" onSubmit={enviar} noValidate>
        <Field as="textarea" rows={4} label="Descreva o ajuste" value={nota} onChange={(e) => setNota(e.target.value)} error={erro || undefined} />
        <div className="dialog__actions">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Enviar ajuste</Button>
        </div>
      </form>
    </Dialog>
  );
}
