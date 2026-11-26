import { useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Bell, ClipboardList, Inbox, LogOut, Plus, Users } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { currentUser, logOut } from '../lib/auth.js';
import { setState, useStore } from '../lib/store.js';
import { when } from '../lib/format.js';

export function AppShell() {
  const user = useStore(currentUser);
  const isCliente = useStore((s) => s.session?.kind === 'cliente');
  const orders = useStore((s) => s.orders);
  const seenAt = useStore((s) => (user ? s.seen[user.id] : undefined));
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = isCliente
    ? [
        { to: '/cliente', label: 'Pedidos', icon: ClipboardList, end: true },
        { to: '/cliente/novo', label: 'Novo pedido', icon: Plus },
      ]
    : [
        { to: '/equipe', label: 'Fila', icon: Inbox, end: true },
        ...(user?.admin ? [{ to: '/admin', label: 'Parceiros', icon: Users }] : []),
      ];

  const events = useMemo(
    () =>
      orders
        .filter((o) => !isCliente || o.clientId === user?.id)
        .flatMap((o) => o.events.map((e) => ({ ...e, title: o.business.name, orderId: o.id })))
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 8),
    [orders, isCliente, user?.id],
  );
  const unread = events.filter((e) => !seenAt || e.at > seenAt).length;

  const markSeen = (open) => {
    if (open && user) setState((s) => ({ ...s, seen: { ...s.seen, [user.id]: new Date().toISOString() } }));
  };
  const leave = () => {
    logOut();
    navigate('/', { replace: true });
  };

  const links = items.map(({ to, label, icon: Icon, end }) => (
    <NavLink key={to} to={to} end={end} className="navlink">
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  ));

  return (
    <div className="shell">
      <aside className="shell__side">
        <Logo />
        <nav className="shell__nav" aria-label="Principal">
          {links}
        </nav>
        <div className="shell__me">
          <p className="shell__name">{user?.name}</p>
          <p className="shell__sub">{isCliente ? user?.businessName : user?.admin ? 'Administrador' : 'Equipe'}</p>
          <button type="button" className="btn btn--ghost btn--block" onClick={leave}>
            <LogOut size={18} aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>

      <header className="shell__top">
        <Logo compact />
        <div className="shell__tools">
          <details className="bell" onToggle={(e) => markSeen(e.currentTarget.open)}>
            <summary className="icon-btn" aria-label={`Atualizações${unread ? ` (${unread} novas)` : ''}`}>
              <Bell size={18} aria-hidden="true" />
              {unread > 0 && <span className="bell__dot" aria-hidden="true" />}
            </summary>
            <div className="bell__panel">
              <p className="bell__title">Atualizações</p>
              {events.length ? (
                <ul>
                  {events.map((e) => (
                    <li key={`${e.orderId}-${e.at}-${e.text}`}>
                      <span>{e.text}</span>
                      <small>
                        {e.title} · {when(e.at)}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Nada novo por aqui.</p>
              )}
            </div>
          </details>
          <button type="button" className="icon-btn shell__logout-mobile" aria-label="Sair" onClick={leave}>
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="main" className="shell__main" tabIndex={-1}>
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <nav className="shell__bottom" aria-label="Principal, celular">
        {links}
      </nav>
    </div>
  );
}
