import { useMemo } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { Empty, useNow } from '../../components/ui.jsx';
import { OrderCard } from '../../components/OrderCard.jsx';
import { currentUser } from '../../lib/auth.js';
import { useStore } from '../../lib/store.js';

export function PainelCliente() {
  const user = useStore(currentUser);
  const orders = useStore((s) => s.orders);
  const now = useNow();
  const meus = useMemo(
    () => orders.filter((o) => o.clientId === user?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, user?.id],
  );
  const primeiro = user?.name?.split(' ')[0];

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1>{primeiro ? `Olá, ${primeiro}` : 'Seus pedidos'}</h1>
          <p className="lead">Veja em que etapa está cada pedido e quando ele fica pronto.</p>
        </div>
        <Link className="btn btn--primary" to="/cliente/novo">
          <Plus size={18} aria-hidden="true" /> Novo pedido
        </Link>
      </header>
      {meus.length ? (
        <ul className="orders">
          {meus.map((o) => (
            <li key={o.id}>
              <OrderCard order={o} now={now} to={`/cliente/pedidos/${o.id}`} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="Você ainda não tem pedidos.">
          <p className="lead">Monte o primeiro pacote em cinco passos. Leva uns minutos.</p>
          <Link className="btn btn--primary" to="/cliente/novo">
            Montar o primeiro pedido
          </Link>
        </Empty>
      )}
    </section>
  );
}
