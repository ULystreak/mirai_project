import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Bar, Button, Dialog, Field, useToast } from '../../components/ui.jsx';
import { Logo } from '../../components/Logo.jsx';
import { logInCliente, logInEquipe, requestReset, resetPassword, sessaoAtiva, signUpCliente } from '../../lib/auth.js';
import { useStore } from '../../lib/store.js';

function AuthPage({ title, lead, children }) {
  return (
    <main id="main" className="auth">
      <section className="auth__card">
        <Logo />
        <div className="auth__head">
          <h1>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
        </div>
        {children}
      </section>
    </main>
  );
}

// Senha com botão para mostrar. O botão fica logo abaixo do campo.
function Senha({ label = 'Senha', name = 'password', ...rest }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <>
      <Field label={label} name={name} type={mostrar ? 'text' : 'password'} {...rest} />
      <button type="button" className="link-btn" aria-pressed={mostrar} onClick={() => setMostrar((v) => !v)}>
        {mostrar ? 'Ocultar senha' : 'Mostrar senha'}
      </button>
    </>
  );
}

function RecuperarSenha({ open, onClose }) {
  const toast = useToast();
  const [passo, setPasso] = useState('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mostrado, setMostrado] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [erro, setErro] = useState('');

  function fechar() {
    setPasso('email');
    setEmail('');
    setCodigo('');
    setMostrado('');
    setNovaSenha('');
    setErro('');
    onClose();
  }

  function enviarCodigo(e) {
    e.preventDefault();
    try {
      setMostrado(requestReset(email));
      setPasso('codigo');
      setErro('');
    } catch (err) {
      setErro(err.message);
    }
  }

  async function trocar(e) {
    e.preventDefault();
    try {
      await resetPassword({ email, code: codigo, password: novaSenha });
      toast('Senha atualizada. Entre com a nova senha.');
      fechar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <Dialog open={open} onClose={fechar} title="Recuperar senha">
      {passo === 'email' ? (
        <form className="dialog__body" onSubmit={enviarCodigo} noValidate>
          <Field label="E-mail da conta" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={erro || undefined} required />
          <div className="dialog__actions">
            <Button variant="ghost" type="button" onClick={fechar}>Cancelar</Button>
            <Button type="submit">Enviar código</Button>
          </div>
        </form>
      ) : (
        <form className="dialog__body" onSubmit={trocar} noValidate>
          <div className="mailbox" role="status">
            <p>Caixa de e-mail (simulação)</p>
            <p>
              Seu código é <strong className="num">{mostrado}</strong>.
            </p>
          </div>
          <Field label="Código recebido" inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          <Field label="Nova senha" type="password" autoComplete="new-password" hint="Pelo menos 8 caracteres." value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required />
          {erro && <p className="form-error" role="alert">{erro}</p>}
          <div className="dialog__actions">
            <Button variant="ghost" type="button" onClick={fechar}>Cancelar</Button>
            <Button type="submit">Redefinir senha</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

export function LoginCliente() {
  const session = useStore((s) => s.session);
  const ativa = useStore(sessaoAtiva);
  const navigate = useNavigate();
  const toast = useToast();
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  if (ativa && session?.kind === 'cliente') return <Navigate to="/cliente" replace />;

  async function entrar(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setOcupado(true);
    setErro('');
    try {
      await logInCliente({ email: String(f.get('email')), password: String(f.get('password')) });
      navigate('/cliente', { replace: true });
    } catch (err) {
      setErro(err.message);
      setOcupado(false);
    }
  }

  return (
    <AuthPage title="Entrar" lead="Acompanhe os seus pedidos e as artes prontas.">
      <form className="auth__form" onSubmit={entrar} noValidate>
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <Senha name="password" autoComplete="current-password" required />
        {erro && <p className="form-error" role="alert">{erro}</p>}
        <Button type="submit" loading={ocupado}>Entrar</Button>
        <button type="button" className="link-btn" onClick={() => setEsqueci(true)}>Esqueci a senha</button>
      </form>
      <p className="divider">ou</p>
      <div className="social">
        {['Google', 'Apple', 'X'].map((rede) => (
          <Button key={rede} variant="ghost" type="button" onClick={() => toast(`Entrada com ${rede} chega com o backend.`)}>
            {rede}
          </Button>
        ))}
      </div>
      <p className="muted">
        Ainda não tem conta? <Link to="/cliente/cadastro">Criar conta</Link>
      </p>
      <RecuperarSenha open={esqueci} onClose={() => setEsqueci(false)} />
    </AuthPage>
  );
}

const FORCAS = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];
const forca = (pw) =>
  [pw.length >= 8, pw.length >= 12, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;

export function CadastroCliente() {
  const session = useStore((s) => s.session);
  const ativa = useStore(sessaoAtiva);
  const navigate = useNavigate();
  const [dados, setDados] = useState({ name: '', businessName: '', email: '', password: '', termos: false });
  const [erros, setErros] = useState({});
  const [ocupado, setOcupado] = useState(false);
  if (ativa && session?.kind === 'cliente') return <Navigate to="/cliente" replace />;

  const campo = (chave) => (e) => setDados((d) => ({ ...d, [chave]: e.target.value }));
  const pontos = forca(dados.password);

  async function criar(e) {
    e.preventDefault();
    const err = {};
    if (dados.name.trim().length < 3) err.name = 'Informe o seu nome completo.';
    if (dados.businessName.trim().length < 2) err.businessName = 'Informe o nome do negócio.';
    if (!/^\S+@\S+\.\S+$/.test(dados.email)) err.email = 'Use um e-mail válido.';
    if (dados.password.length < 8) err.password = 'A senha precisa ter pelo menos 8 caracteres.';
    if (!dados.termos) err.termos = 'Aceite os termos para continuar.';
    setErros(err);
    if (Object.keys(err).length) return;
    setOcupado(true);
    try {
      await signUpCliente(dados);
      navigate('/cliente', { replace: true });
    } catch (ex) {
      setErros({ email: ex.message });
      setOcupado(false);
    }
  }

  return (
    <AuthPage title="Criar conta" lead="Leva menos de um minuto. Depois você monta o primeiro pedido.">
      <form className="auth__form" onSubmit={criar} noValidate>
        <Field label="Seu nome" name="name" autoComplete="name" value={dados.name} onChange={campo('name')} error={erros.name} />
        <Field label="Nome do negócio" name="businessName" autoComplete="organization" value={dados.businessName} onChange={campo('businessName')} error={erros.businessName} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" value={dados.email} onChange={campo('email')} error={erros.email} />
        <Senha label="Senha" name="password" autoComplete="new-password" value={dados.password} onChange={campo('password')} error={erros.password} hint="Pelo menos 8 caracteres." />
        <div className="strength" aria-live="polite">
          <Bar value={pontos / 5} label="Força da senha" />
          <span>{dados.password ? FORCAS[Math.min(pontos, 4)] : 'Digite uma senha para ver a força.'}</span>
        </div>
        <label className="check">
          <input type="checkbox" checked={dados.termos} onChange={(e) => setDados((d) => ({ ...d, termos: e.target.checked }))} />
          Li e aceito os termos de uso (texto de exemplo nesta prévia).
        </label>
        {erros.termos && <p className="field__error" role="alert">{erros.termos}</p>}
        <Button type="submit" loading={ocupado}>Criar conta</Button>
      </form>
      <p className="muted">
        Já tem conta? <Link to="/cliente/entrar">Entrar</Link>
      </p>
    </AuthPage>
  );
}

// Equipe: sem cadastro. O acesso é criado pelo administrador.
export function LoginEquipe() {
  const session = useStore((s) => s.session);
  const ativa = useStore(sessaoAtiva);
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  if (ativa && session?.kind === 'equipe') return <Navigate to={session.id === 'admin' ? '/admin' : '/equipe'} replace />;

  async function entrar(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setOcupado(true);
    setErro('');
    try {
      const p = await logInEquipe({ username: String(f.get('username')), password: String(f.get('password')) });
      navigate(p.admin ? '/admin' : '/equipe', { replace: true });
    } catch (err) {
      setErro(err.message);
      setOcupado(false);
    }
  }

  return (
    <AuthPage title="Equipe" lead="Use o usuário e a senha criados pelo administrador. Não há cadastro por aqui.">
      <form className="auth__form" onSubmit={entrar} noValidate>
        <Field label="Usuário" name="username" autoComplete="username" required />
        <Senha name="password" autoComplete="current-password" required />
        {erro && <p className="form-error" role="alert">{erro}</p>}
        <Button type="submit" loading={ocupado}>Entrar na equipe</Button>
      </form>
    </AuthPage>
  );
}
