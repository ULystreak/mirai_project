import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CountUp, Empty, Field, StatusPill, Tabs, cx, useNow } from '../../components/ui.jsx';
import { STATUS, currentStage, isLate, orderStatus } from '../../lib/orders.js';
import { useStore } from '../../lib/store.js';
import { when } from '../../lib/format.js';
import { countdown } from '../../lib/time.js';

const ABAS = [
  { id: 'novo', label: 'Novos', pega: (st) => st === 'novo' },
  { id: 'producao', label: 'Em produção', pega: (st) => st === 'producao' },
  { id: 'entregues', label: 'Entregues', pega: (st) => st === 'aguardando' || st === 'concluido' },
  { id: 'recusado', label: 'Recusados', pega: (st) => st === 'recusado' },
];

// Pedidos com o prazo mais próximo primeiro.
const prazoDe = (o) => {
  const c = currentStage(o);
  return c?.deadline ? new Date(c.deadline).getTime() : Number.POSITIVE_INFINITY;
};

export function Fila() {
  const orders = useStore((s) => s.orders);
  const partners = useStore((s) => s.partners);
  const now = useNow();
  const [aba, setAba] = useState('novo');
  const [busca, setBusca] = useState('');

  const lista = useMemo(() => orders.map((o) => ({ o, st: orderStatus(o) })), [orders]);
  const abas = ABAS.map((a) => ({ id: a.id, label: a.label, count: lista.filter((x) => a.pega(x.st)).length }));
  const atrasados = lista.filter(({ o, st }) => st === 'producao' && isLate(currentStage(o), now)).length;

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const pega = ABAS.find((a) => a.id === aba).pega;
    return lista
      .filter(({ st }) => pega(st))
      .filter(({ o }) => o.business.name.toLowerCase().includes(termo))
      .sort((x, y) => prazoDe(x.o) - prazoDe(y.o));
  }, [lista, aba, busca]);

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1>Fila de pedidos</h1>
          <p className="lead">Aceite o que dá para entregar no prazo e acompanhe cada etapa.</p>
        </div>
        <p className="stats" aria-live="polite">
          <span>
            <CountUp to={abas[0].count} /> novos
          </span>
          <span>
            <CountUp to={abas[1].count} /> em produção
          </span>
          <span>
            <CountUp to={atrasados} /> atrasados
          </span>
        </p>
      </header>

      <div className="toolbar">
        <Tabs items={abas} value={aba} onChange={setAba} label="Filtrar pedidos" />
        <Field type="search" label="Buscar pelo nome do negócio" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {visiveis.length ? (
        <ul className="queue">
          {visiveis.map(({ o, st }) => {
            const c = currentStage(o);
            const responsavel = partners.find((p) => p.id === o.assigneeId)?.name;
            return (
              <li key={o.id}>
                <Link to={`/equipe/pedidos/${o.id}`} className="queue__row">
                  <span className="queue__name">{o.business.name}</span>
                  <StatusPill status={st} label={STATUS[st]} />
                  <span className="queue__meta">
                    {o.postsTotal} posts · {o.packageName} · {responsavel ?? 'sem responsável'}
                  </span>
                  <span className={cx('queue__deadline', isLate(c, now) && 'is-late')}>
                    {c?.deadline ? `${c.label}: ${when(c.deadline)} · ${countdown(c.deadline, now)}` : 'Aguardando aceite'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty title="Nada nesta aba por enquanto." />
      )}
    </section>
  );
}
