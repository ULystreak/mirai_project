import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Download, Pencil, Upload } from 'lucide-react';
import { Arte, Button, Dialog, Empty, Field, StatusPill, useAcao, useNow, useToast } from '../../components/ui.jsx';
import { Timeline } from '../../components/Timeline.jsx';
import { Revelacao } from '../../components/Revelacao.jsx';
import { currentUser } from '../../lib/auth.js';
import {
  STATUS,
  acceptOrder,
  addDelivery,
  assignOrder,
  completeStage,
  currentStage,
  deliverOrder,
  eta,
  orderStatus,
  progress,
  rejectOrder,
  remainingHours,
  setStageDeadline,
} from '../../lib/orders.js';
import { downloadBlob, getBlob, prepareImage, putBlob, useBlobUrl } from '../../lib/media.js';
import { patchOrder, useStore } from '../../lib/store.js';
import { fromLocalInput, toLocalInput, when } from '../../lib/format.js';
import { countdown, formatDays, formatHours } from '../../lib/time.js';

const baixarArquivo = async (blobKey, name) => downloadBlob(await getBlob(blobKey), name);

// Detalhe do pedido para a equipe: aceitar, recusar, prazos, etapas, materiais e entregas.
export function PedidoEquipe() {
  const { id } = useParams();
  const me = useStore(currentUser);
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const partners = useStore((s) => s.partners);
  const now = useNow();
  const acao = useAcao();
  const [recusando, setRecusando] = useState(false);
  const [ampliado, setAmpliado] = useState(null);
  const primeiraUrl = useBlobUrl(order?.materials[0]?.blobKey);

  if (!order) {
    return (
      <section className="page">
        <Empty title="Não encontramos este pedido.">
          <Link className="btn btn--ghost" to="/equipe">Voltar à fila</Link>
        </Empty>
      </section>
    );
  }

  const st = orderStatus(order);
  const cur = currentStage(order);
  const responsavel = partners.find((p) => p.id === order.assigneeId)?.name;
  const emAndamento = st === 'producao';
  const podeConcluir = emAndamento && !!cur && cur.key !== 'aceito' && cur.key !== 'entrega';
  const podeEntregar = emAndamento && cur?.key === 'entrega';
  const previsao = eta(order);
  const restante = remainingHours(order);
  const b = order.business;
  const idn = order.identity;

  const rodar = (fn, sucesso) => acao(() => patchOrder(order.id, fn), sucesso);

  return (
    <section className="page">
      <header className="order-hero">
        <Revelacao src={primeiraUrl} progress={progress(order)} className="order-hero__art" label={`Progresso de ${b.name}`} />
        <div className="order-hero__body">
          <StatusPill status={st} label={STATUS[st]} />
          <h1>{b.name}</h1>
          <p className="lead">
            {order.postsTotal} posts · {order.packageName} · {responsavel ? `com ${responsavel}` : 'sem responsável'}
          </p>
          {cur && (
            <p className="lead">
              Etapa atual: <strong>{cur.label}</strong>
            </p>
          )}
          {(st === 'novo' || emAndamento) && previsao && (
            <dl className="kv">
              <dt>Previsão</dt>
              <dd className="num">{when(previsao)}</dd>
              <dt>Falta</dt>
              <dd className="num">{countdown(previsao, now)}</dd>
              <dt>Trabalho restante</dt>
              <dd className="num">
                {formatHours(restante)} · {formatDays(restante)}
              </dd>
            </dl>
          )}
          {order.adjusting && <p className="note">Ajuste pedido pelo cliente: {order.adjustmentNote}</p>}
          {st === 'recusado' && <p className="form-error">Recusado: {order.rejectionReason}</p>}

          <div className="actions">
            {st === 'novo' && (
              <>
                <Button onClick={() => rodar((o) => acceptOrder(o, me.id), 'Projeto aceito. O cliente já vê a previsão.')}>
                  Aceitar projeto
                </Button>
                <Button variant="danger" type="button" onClick={() => setRecusando(true)}>
                  Recusar
                </Button>
              </>
            )}
            {podeConcluir && <Button onClick={() => rodar((o) => completeStage(o), 'Etapa concluída.')}>Concluir etapa: {cur.label}</Button>}
            {podeEntregar && (
              <Button disabled={!order.deliveries.length} onClick={() => rodar((o) => deliverOrder(o), 'Entrega enviada ao cliente.')}>
                Enviar entrega final
              </Button>
            )}
            {emAndamento && order.assigneeId !== me.id && (
              <Button variant="ghost" onClick={() => rodar((o) => assignOrder(o, me.id), 'Pedido com você.')}>
                Assumir pedido
              </Button>
            )}
          </div>
          {podeEntregar && !order.deliveries.length && (
            <p className="muted">Envie pelo menos uma arte antes da entrega final.</p>
          )}
        </div>
      </header>

      <div className="order-grid">
        <div className="stack">
          <section className="section" aria-labelledby="briefing">
            <h2 id="briefing">Briefing</h2>
            <dl className="kv">
              <dt>Segmento</dt>
              <dd>{b.segment}</dd>
              <dt>Cidade</dt>
              <dd>{b.city}</dd>
              <dt>WhatsApp</dt>
              <dd className="num">{b.whatsapp}</dd>
              <dt>Instagram</dt>
              <dd>{b.instagram || '—'}</dd>
              <dt>Site</dt>
              <dd>{b.site || '—'}</dd>
              <dt>Horário</dt>
              <dd>{b.hours || '—'}</dd>
              <dt>Cores</dt>
              <dd>
                {idn.colors.length
                  ? idn.colors.map((c) => <span key={c} className="swatch" style={{ background: c }} title={c} />)
                  : '—'}
              </dd>
              <dt>Estilo</dt>
              <dd>{idn.styles.join(', ') || '—'}</dd>
              <dt>Tom de voz</dt>
              <dd>{idn.tone || '—'}</dd>
              <dt>Palavras-chave</dt>
              <dd>{idn.keywords || '—'}</dd>
              <dt>Evitar</dt>
              <dd>{idn.avoid || '—'}</dd>
              <dt>Artes até</dt>
              <dd className="num">{order.dueWanted ? when(order.dueWanted) : 'sem data'}</dd>
            </dl>
            <h3>Posts pedidos</h3>
            <ol className="posts-list">
              {order.posts.map((p, i) => (
                <li key={p.id}>
                  <strong>
                    {i + 1}. {p.type}
                  </strong>
                  <span>{p.brief}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="section" aria-labelledby="materiais">
            <h2 id="materiais">Materiais do cliente</h2>
            <ul className="thumbs">
              {order.materials.map((m) => (
                <li key={m.id} className="thumb">
                  <button type="button" className="thumb__open" onClick={() => setAmpliado(m)} aria-label={`Ampliar ${m.name}`}>
                    <Arte blobKey={m.blobKey} />
                  </button>
                  <p className="thumb__name">{m.name}</p>
                  <div className="thumb__actions">
                    <Button variant="ghost" type="button" onClick={() => baixarArquivo(m.blobKey, m.name)}>
                      <Download size={16} aria-hidden="true" /> Baixar
                    </Button>
                    <Link className="btn btn--ghost" to={`/equipe/editor/${order.id}/${m.id}`}>
                      <Pencil size={16} aria-hidden="true" /> Editar
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {emAndamento && (
            <section className="section" aria-labelledby="prazos">
              <h2 id="prazos">Prazos por etapa</h2>
              <p className="muted">Ajuste a data de uma etapa em andamento. As seguintes são recalculadas a partir dela.</p>
              <ul className="deadlines">
                {order.stages
                  .filter((s) => !s.doneAt)
                  .map((s) => (
                    <PrazoEtapa
                      key={s.key}
                      stage={s}
                      onSalvar={(iso) => rodar((o) => setStageDeadline(o, s.key, iso), 'Prazo salvo.')}
                    />
                  ))}
              </ul>
            </section>
          )}
        </div>

        <div className="stack">
          <section className="section" aria-labelledby="andamento">
            <h2 id="andamento">Andamento</h2>
            <Timeline order={order} now={now} />
          </section>

          <section className="section" aria-labelledby="entregas">
            <h2 id="entregas">Artes entregues</h2>
            {order.deliveries.length ? (
              <ul className="arts">
                {order.deliveries.map((d) => (
                  <li key={d.id} className="art">
                    <Arte blobKey={d.blobKey} alt={d.name} />
                    <div className="art__body">
                      <p>{d.name}</p>
                      {d.caption && <p>{d.caption}</p>}
                      {d.hashtags && <p className="muted">{d.hashtags}</p>}
                      {d.suggestedDate && <p className="muted num">Sugestão de postagem: {d.suggestedDate}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Nenhuma arte enviada ainda.</p>
            )}
            {st !== 'concluido' && st !== 'recusado' && (
              <NovaEntrega onAdicionar={(d) => rodar((o) => addDelivery(o, d), 'Arte enviada.')} />
            )}
          </section>

          <section className="section" aria-labelledby="historico">
            <h2 id="historico">Histórico</h2>
            <ul className="history">
              {[...order.events].reverse().map((e) => (
                <li key={order.events.indexOf(e)}>
                  <span>{e.text}</span>
                  <small className="muted num">{when(e.at)}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <RecusarDialog
        open={recusando}
        onClose={() => setRecusando(false)}
        onConfirmar={(motivo) => {
          rodar((o) => rejectOrder(o, motivo), 'Pedido recusado.');
          setRecusando(false);
        }}
      />
      <Dialog open={!!ampliado} onClose={() => setAmpliado(null)} title={ampliado?.name ?? ''} className="dialog--wide">
        {ampliado && <Arte blobKey={ampliado.blobKey} alt={ampliado.name} />}
      </Dialog>
    </section>
  );
}

function PrazoEtapa({ stage, onSalvar }) {
  const [valor, setValor] = useState(toLocalInput(stage.deadline));
  return (
    <li className="deadline-row">
      <Field type="datetime-local" label={stage.label} value={valor} onChange={(e) => setValor(e.target.value)} />
      <Button variant="ghost" type="button" disabled={!valor} onClick={() => onSalvar(fromLocalInput(valor))}>
        Salvar prazo
      </Button>
    </li>
  );
}

function NovaEntrega({ onAdicionar }) {
  const toast = useToast();
  const [texto, setTexto] = useState({ caption: '', hashtags: '', suggestedDate: '' });
  const [enviando, setEnviando] = useState(false);

  async function receber(e) {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!arquivos.length) return;
    setEnviando(true);
    for (const file of arquivos) {
      try {
        const { blob, width, height } = await prepareImage(file);
        const blobKey = crypto.randomUUID();
        await putBlob(blobKey, blob);
        onAdicionar({ id: crypto.randomUUID(), name: file.name, blobKey, width, height, ...texto });
      } catch (err) {
        toast(err.message, 'error');
      }
    }
    setEnviando(false);
  }

  return (
    <div className="nova-entrega">
      <h3>Enviar arte final</h3>
      <Field as="textarea" rows={3} label="Legenda" value={texto.caption} onChange={(e) => setTexto({ ...texto, caption: e.target.value })} />
      <Field label="Hashtags" placeholder="#padaria #paoartesanal" value={texto.hashtags} onChange={(e) => setTexto({ ...texto, hashtags: e.target.value })} />
      <Field type="date" label="Sugestão de postagem" value={texto.suggestedDate} onChange={(e) => setTexto({ ...texto, suggestedDate: e.target.value })} />
      <label className="btn btn--ghost file-btn">
        <Upload size={18} aria-hidden="true" /> {enviando ? 'Enviando…' : 'Escolher artes'}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={enviando} onChange={receber} />
      </label>
    </div>
  );
}

function RecusarDialog({ open, onClose, onConfirmar }) {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');

  function confirmar(e) {
    e.preventDefault();
    if (motivo.trim().length < 10) {
      setErro('Explique o motivo com pelo menos 10 caracteres.');
      return;
    }
    onConfirmar(motivo.trim());
    setMotivo('');
    setErro('');
  }

  return (
    <Dialog open={open} onClose={onClose} title="Recusar este pedido">
      <form className="dialog__body" onSubmit={confirmar} noValidate>
        <Field as="textarea" rows={4} label="Motivo (o cliente vê)" value={motivo} onChange={(e) => setMotivo(e.target.value)} error={erro || undefined} />
        <div className="dialog__actions">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" type="submit">Recusar pedido</Button>
        </div>
      </form>
    </Dialog>
  );
}
