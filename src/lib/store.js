import { useSyncExternalStore } from 'react';

// ponytail: o estado inteiro vai num JSON no localStorage. Imagens ficam no IndexedDB (media.js).
const KEY = 'mirai:v1';
const EMPTY = { clients: [], partners: [], orders: [], session: null, drafts: {}, seen: {} };

const load = () => {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...EMPTY };
  }
};

let state = load();
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
  localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

export function patchOrder(id, fn) {
  setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? fn(o) : o)) }));
}

// O seletor deve devolver referências existentes (nada novo a cada chamada).
export const useStore = (selector = (s) => s) => useSyncExternalStore(subscribe, () => selector(state));

// Outra aba mudou o estado: recarrega e avisa os componentes.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    emit();
  }
});
