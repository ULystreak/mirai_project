import { useSyncExternalStore } from 'react';

// ponytail: os dados ficam num JSON no localStorage (compartilhado entre abas). Imagens ficam no IndexedDB (media.js).
// A sessão fica no sessionStorage, que é por aba: cada aba pode estar logada com um papel diferente.
const KEY = 'mirai:v1';
const SESSION_KEY = 'mirai:session';
const EMPTY = { clients: [], partners: [], orders: [], drafts: {}, seen: {} };

const load = () => {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...EMPTY };
  }
};

const loadSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
};

let state = { ...load(), session: loadSession() };
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const uid = () => crypto.randomUUID();
export const getState = () => state;

export function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  const { session, ...shared } = state;
  localStorage.setItem(KEY, JSON.stringify(shared));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session ?? null));
  emit();
}

export function patchOrder(id, fn) {
  setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? fn(o) : o)) }));
}

// O seletor deve devolver referências existentes (nada novo a cada chamada).
export const useStore = (selector = (s) => s) => useSyncExternalStore(subscribe, () => selector(state));

// Outra aba mudou os dados: recarrega, mantendo a sessão desta aba, e avisa os componentes.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = { ...load(), session: state.session };
    emit();
  }
});
