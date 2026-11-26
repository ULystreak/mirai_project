import { getState, setState, uid } from './store.js';

// ponytail: autenticação simulada. A senha vira hash SHA-256 no navegador; não é segurança de verdade.
const enc = new TextEncoder();
const norm = (v) => v.trim().toLowerCase();
const now = () => new Date().toISOString();
const fail = (msg) => {
  throw new Error(msg);
};

export async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ponytail: senha de demonstração no código, por pedido do projeto. Trocar antes de produção.
export const ADMIN_USERNAME = 'mirai';
const ADMIN_PASSWORD = 'admin123';

export async function ensureAdmin() {
  if (getState().partners.some((p) => p.admin)) return;
  const passwordHash = await sha256(ADMIN_PASSWORD);
  setState((s) => ({
    ...s,
    partners: [
      ...s.partners,
      { id: 'admin', name: 'Administrador', username: ADMIN_USERNAME, role: 'Administrador', passwordHash, active: true, admin: true, createdAt: now() },
    ],
  }));
}

export function currentUser(s = getState()) {
  if (!s.session) return null;
  const list = s.session.kind === 'cliente' ? s.clients : s.partners;
  return list.find((u) => u.id === s.session.id) ?? null;
}

// Sessão válida: há um usuário e, se for da equipe, o acesso continua ativo.
export const sessaoAtiva = (s = getState()) => {
  const u = currentUser(s);
  return !!u && (s.session.kind === 'cliente' || u.active !== false);
};

export async function signUpCliente({ name, email, password, businessName }) {
  if (password.length < 8) fail('A senha precisa ter pelo menos 8 caracteres.');
  if (getState().clients.some((c) => norm(c.email) === norm(email))) fail('Já existe uma conta com este e-mail. Entre com a sua senha.');
  const client = {
    id: uid(),
    name: name.trim(),
    email: email.trim(),
    businessName: businessName.trim(),
    passwordHash: await sha256(password),
    createdAt: now(),
  };
  setState((s) => ({ ...s, clients: [...s.clients, client], session: { kind: 'cliente', id: client.id } }));
}

export async function logInCliente({ email, password }) {
  const c = getState().clients.find((x) => norm(x.email) === norm(email));
  if (!c || c.passwordHash !== (await sha256(password))) fail('E-mail ou senha incorretos.');
  setState((s) => ({ ...s, session: { kind: 'cliente', id: c.id } }));
}

export async function logInEquipe({ username, password }) {
  const p = getState().partners.find((x) => norm(x.username) === norm(username));
  if (!p || p.passwordHash !== (await sha256(password))) fail('Usuário ou senha incorretos.');
  if (!p.active) fail('Este acesso está desativado. Fale com o administrador.');
  setState((s) => ({ ...s, session: { kind: 'equipe', id: p.id } }));
  return p;
}

export function logOut() {
  setState((s) => ({ ...s, session: null }));
}

// Recuperação simulada: o código aparece na tela, como numa caixa de e-mail de teste.
// ponytail: códigos ficam só na memória; somem ao recarregar a página.
const codes = new Map();
export function requestReset(email) {
  const c = getState().clients.find((x) => norm(x.email) === norm(email));
  if (!c) fail('Não encontramos uma conta com este e-mail.');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  codes.set(c.id, code);
  return code;
}

export async function resetPassword({ email, code, password }) {
  const c = getState().clients.find((x) => norm(x.email) === norm(email));
  if (!c || codes.get(c.id) !== code.trim()) fail('Código inválido. Confira o código exibido na tela.');
  if (password.length < 8) fail('A senha precisa ter pelo menos 8 caracteres.');
  const passwordHash = await sha256(password);
  setState((s) => ({ ...s, clients: s.clients.map((x) => (x.id === c.id ? { ...x, passwordHash } : x)) }));
  codes.delete(c.id);
}

// Senha de parceiro: 10 caracteres sem símbolos ambíguos, mostrada uma vez.
export function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return [...crypto.getRandomValues(new Uint8Array(10))].map((b) => chars[b % chars.length]).join('');
}

export async function createPartner({ name, username, role }) {
  const user = norm(username);
  if (getState().partners.some((p) => norm(p.username) === user)) fail('Este usuário já existe. Escolha outro.');
  const password = generatePassword();
  const partner = { id: uid(), name: name.trim(), username: user, role, passwordHash: await sha256(password), active: true, createdAt: now() };
  setState((s) => ({ ...s, partners: [...s.partners, partner] }));
  return { partner, password };
}

export async function resetPartnerPassword(id) {
  const password = generatePassword();
  const passwordHash = await sha256(password);
  setState((s) => ({ ...s, partners: s.partners.map((p) => (p.id === id ? { ...p, passwordHash } : p)) }));
  return password;
}

export function setPartnerActive(id, active) {
  setState((s) => ({ ...s, partners: s.partners.map((p) => (p.id === id && !p.admin ? { ...p, active } : p)) }));
}

export function deletePartner(id) {
  setState((s) => ({
    ...s,
    partners: s.partners.filter((p) => p.id !== id || p.admin),
    orders: s.orders.map((o) => (o.assigneeId === id ? { ...o, assigneeId: null } : o)),
    session: s.session?.id === id ? null : s.session,
  }));
}
