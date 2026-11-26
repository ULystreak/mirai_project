import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useBlobUrl } from '../lib/media.js';

export const cx = (...names) => names.filter(Boolean).join(' ');

export function Button({ variant = 'primary', loading = false, className, children, ...props }) {
  return (
    <button {...props} className={cx('btn', `btn--${variant}`, className)} disabled={loading || props.disabled} aria-busy={loading || undefined}>
      {children}
    </button>
  );
}

export function Field({ label, hint, error, as: Tag = 'input', id, ...rest }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="field">
      <label htmlFor={fid}>{label}</label>
      <Tag
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={cx(hint && `${fid}-hint`, error && `${fid}-err`) || undefined}
        {...rest}
      />
      {hint && <p id={`${fid}-hint`} className="field__hint">{hint}</p>}
      {error && <p id={`${fid}-err`} className="field__error">{error}</p>}
    </div>
  );
}

const TONE = {
  novo: 'pill--new',
  producao: 'pill--work',
  aguardando: 'pill--gold',
  concluido: 'pill--done',
  recusado: 'pill--danger',
};
export const StatusPill = ({ status, label }) => <span className={cx('pill', TONE[status])}>{label}</span>;

// Diálogo nativo: foco preso e Esc já vêm de graça. Na saída, o último conteúdo aberto continua
// na caixa até ela sumir, para ela não aparecer vazia enquanto fecha.
export function Dialog({ open, onClose, title, className, children }) {
  const ref = useRef(null);
  const titleId = useId();
  const ultimo = useRef({ title, children });
  useEffect(() => {
    if (open) ultimo.current = { title, children };
  });
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const mostrado = open ? { title, children } : ultimo.current;
  return (
    <dialog ref={ref} className={cx('dialog', className)} aria-labelledby={titleId} onClose={onClose}>
      <div className="dialog__head">
        <h2 id={titleId}>{mostrado.title}</h2>
        <button type="button" className="icon-btn" aria-label="Fechar" onClick={() => ref.current.close()}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {mostrado.children}
    </dialog>
  );
}

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, tone = 'ok') => {
    const id = crypto.randomUUID();
    setItems((xs) => [...xs, { id, text, tone }]);
    // Aos 4,05 s o toast começa a sair (150 ms, em CSS). Aos 4,2 s ele é removido.
    setTimeout(() => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, saindo: true } : x))), 4050);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx('toast', t.tone === 'error' && 'toast--error')}
            data-saindo={t.saindo || undefined}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// Roda uma ação e avisa o resultado: a mensagem de sucesso ou o erro.
export function useAcao() {
  const toast = useToast();
  return (fn, sucesso) => {
    try {
      fn();
      if (sucesso) toast(sucesso);
    } catch (err) {
      toast(err.message, 'error');
    }
  };
}

export function Bar({ value, label }) {
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <span className="bar__fill" style={{ '--v': value }} />
    </div>
  );
}

// Contagem até `to`, desacelerando. Com "reduzir movimento", o valor aparece direto.
export function CountUp({ to }) {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValor(to);
      return undefined;
    }
    const inicio = performance.now();
    let quadro;
    const passo = (agora) => {
      const p = Math.min(1, (agora - inicio) / 700);
      setValor(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [to]);
  return <span className="num">{valor}</span>;
}

export function Tabs({ items, value, onChange, label }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {items.map((it) => (
        <button key={it.id} type="button" className="tab" aria-pressed={value === it.id} onClick={() => onChange(it.id)}>
          {it.label}
          <span className="tab__count num">{it.count}</span>
        </button>
      ))}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// Imagem guardada no IndexedDB. Enquanto carrega, mostra o esqueleto.
export function Arte({ blobKey, alt = '', className }) {
  const url = useBlobUrl(blobKey);
  return (
    <div className={cx('arte', className)}>
      {url ? <img src={url} alt={alt} /> : <span className="skeleton" aria-hidden="true" />}
    </div>
  );
}

export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
