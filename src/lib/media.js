import { useEffect, useState } from 'react';

// ponytail: IndexedDB puro, sem biblioteca. Imagens ficam fora do localStorage (cota de ~5 MB).
let dbp;
function db() {
  dbp ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('mirai-media', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('blobs');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

async function run(mode, op) {
  const tx = (await db()).transaction('blobs', mode);
  const req = op(tx.objectStore('blobs'));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const putBlob = (key, blob) => run('readwrite', (s) => s.put(blob, key)).then(() => key);
export const getBlob = (key) => run('readonly', (s) => s.get(key));
export const delBlob = (key) => run('readwrite', (s) => s.delete(key));

const MAX_SIDE = 2048;
const MAX_BYTES = 10 * 1024 * 1024;

// Reduz a imagem para no máximo 2048 px e devolve o blob pronto para guardar.
export async function prepareImage(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} não é uma imagem.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name} passa de 10 MB.`);
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const width = Math.round(bmp.width * k);
  const height = Math.round(bmp.height * k);
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  canvas.getContext('2d').drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const type = file.type === 'image/jpeg' || file.type === 'image/webp' ? file.type : 'image/png';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.92));
  return { blob, width, height };
}

// URL temporária de um blob guardado; libera a memória ao sair da tela.
export function useBlobUrl(key) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!key) return undefined;
    let current = null;
    let alive = true;
    getBlob(key).then((blob) => {
      if (!alive || !blob) return;
      current = URL.createObjectURL(blob);
      setUrl(current);
    });
    return () => {
      alive = false;
      if (current) URL.revokeObjectURL(current);
      setUrl(null);
    };
  }, [key]);
  return url;
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
