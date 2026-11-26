import { lazy, Suspense } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { AppShell } from './components/Shell.jsx';
import { ToastProvider } from './components/ui.jsx';
import { Logo } from './components/Logo.jsx';
import { currentUser } from './lib/auth.js';
import { useStore } from './lib/store.js';

// Cada tela carrega só quando é aberta.
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const Entrada = page(() => import('./features/entrada/Entrada.jsx'), 'Entrada');
const LoginCliente = page(() => import('./features/auth/Auth.jsx'), 'LoginCliente');
const CadastroCliente = page(() => import('./features/auth/Auth.jsx'), 'CadastroCliente');
const LoginEquipe = page(() => import('./features/auth/Auth.jsx'), 'LoginEquipe');
const PainelCliente = page(() => import('./features/cliente/Painel.jsx'), 'PainelCliente');
const NovoPedido = page(() => import('./features/cliente/NovoPedido.jsx'), 'NovoPedido');
const PedidoCliente = page(() => import('./features/cliente/PedidoCliente.jsx'), 'PedidoCliente');
const Fila = page(() => import('./features/equipe/Fila.jsx'), 'Fila');
const PedidoEquipe = page(() => import('./features/equipe/PedidoEquipe.jsx'), 'PedidoEquipe');
const Editor = page(() => import('./features/editor/Editor.jsx'), 'Editor');
const Admin = page(() => import('./features/admin/Admin.jsx'), 'Admin');

// Protege as áreas por papel. Sem sessão do papel certo, manda para o login daquele papel.
function Guard({ kind }) {
  const session = useStore((s) => s.session);
  const user = useStore(currentUser);
  const { pathname } = useLocation();
  const login = kind === 'cliente' ? '/cliente/entrar' : '/equipe/entrar';
  if (!session || (kind === 'cliente') !== (session.kind === 'cliente')) {
    return <Navigate to={login} replace state={{ from: pathname }} />;
  }
  if (kind === 'admin' && !user?.admin) return <Navigate to="/equipe" replace />;
  return <Outlet />;
}

function Boot() {
  return (
    <main className="boot" aria-busy="true">
      <Logo />
    </main>
  );
}

function NotFound() {
  return (
    <main id="main" className="notfound">
      <Logo />
      <h1>Não encontramos esta página.</h1>
      <p className="lead">Volte ao início e escolha o seu acesso.</p>
      <Link className="btn btn--primary" to="/">Ir para o início</Link>
    </main>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<Boot />}>
        <Routes>
          <Route index element={<Entrada />} />
          <Route path="cliente/entrar" element={<LoginCliente />} />
          <Route path="cliente/cadastro" element={<CadastroCliente />} />
          <Route element={<Guard kind="cliente" />}>
            <Route element={<AppShell />}>
              <Route path="cliente" element={<PainelCliente />} />
              <Route path="cliente/novo" element={<NovoPedido />} />
              <Route path="cliente/pedidos/:id" element={<PedidoCliente />} />
            </Route>
          </Route>
          <Route path="equipe/entrar" element={<LoginEquipe />} />
          <Route element={<Guard kind="equipe" />}>
            <Route element={<AppShell />}>
              <Route path="equipe" element={<Fila />} />
              <Route path="equipe/pedidos/:id" element={<PedidoEquipe />} />
            </Route>
            <Route path="equipe/editor/:id/:materialId" element={<Editor />} />
          </Route>
          <Route element={<Guard kind="admin" />}>
            <Route element={<AppShell />}>
              <Route path="admin" element={<Admin />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}
