import { useEffect, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Redo2, Save, Undo2 } from 'lucide-react';
import { Button, Empty, Field, useToast } from '../../components/ui.jsx';
import { TEXT_FONTS } from '../../data/catalog.js';
import { FORMATS, renderArt, toBlob } from '../../lib/editor.js';
import { addDelivery } from '../../lib/orders.js';
import { downloadBlob, getBlob, putBlob } from '../../lib/media.js';
import { patchOrder, useStore } from '../../lib/store.js';

const INICIAL = {
  format: '4:5',
  zoom: 1,
  panX: 0,
  panY: 0,
  adjust: { brightness: 0, contrast: 0, saturation: 0 },
  text: { value: '', size: 0.07, color: '#FFFFFF', font: 'display', pill: true, x: 0.5, y: 0.85 },
};

// Histórico de ajustes: desfazer e refazer. Arrastar gera um único passo.
function historico(h, a) {
  switch (a.type) {
    case 'live':
      return { ...h, present: a.fn(h.present) };
    case 'push':
      return a.antes === h.present ? h : { past: [...h.past, a.antes].slice(-60), present: h.present, future: [] };
    case 'set':
      return { past: [...h.past, h.present].slice(-60), present: a.next, future: [] };
    case 'undo':
      return h.past.length
        ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] }
        : h;
    case 'redo':
      return h.future.length
        ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) }
        : h;
    default:
      return h;
  }
}

// Editor básico: enquadrar, ajustar cor, escrever texto, exportar e salvar como arte do pedido.
export function Editor() {
  const { id, materialId } = useParams();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const material = order?.materials.find((m) => m.id === materialId);
  const [h, dispatch] = useReducer(historico, { past: [], present: INICIAL, future: [] });
  const cfg = h.present;
  const [img, setImg] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const canvasRef = useRef(null);
  const caixaRef = useRef(null);
  const arrasto = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const chaveMaterial = material?.blobKey;

  // Carrega a imagem do material.
  useEffect(() => {
    if (!chaveMaterial) return undefined;
    let vivo = true;
    getBlob(chaveMaterial)
      .then((blob) => (blob ? createImageBitmap(blob) : null))
      .then((bmp) => {
        if (vivo && bmp) setImg(bmp);
      });
    return () => {
      vivo = false;
    };
  }, [chaveMaterial]);

  // Redesenha a prévia quando algo muda. Espera as fontes para o texto sair certo.
  useEffect(() => {
    if (!img) return undefined;
    let vivo = true;
    const desenhar = () => {
      if (!vivo || !canvasRef.current) return;
      const { canvas, box } = renderArt({ img, format: cfg.format, zoom: cfg.zoom, panX: cfg.panX, panY: cfg.panY, adjust: cfg.adjust, text: cfg.text, maxW: 720 });
      const saida = canvasRef.current;
      saida.width = canvas.width;
      saida.height = canvas.height;
      saida.getContext('2d').drawImage(canvas, 0, 0);
      caixaRef.current = box;
    };
    Promise.all([
      document.fonts.load('700 40px "Bricolage Grotesque Variable"'),
      document.fonts.load('400 40px "Inter Variable"'),
    ]).then(desenhar, desenhar);
    return () => {
      vivo = false;
    };
  }, [img, cfg]);

  // Ctrl+Z e Ctrl+Shift+Z, fora de campos de texto.
  useEffect(() => {
    const tecla = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.target.closest?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'undo' });
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        dispatch({ type: 'redo' });
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  const mudar = (patch) => dispatch({ type: 'set', next: { ...cfg, ...patch } });
  const mudarAjuste = (chave, valor) => dispatch({ type: 'set', next: { ...cfg, adjust: { ...cfg.adjust, [chave]: valor } } });
  const mudarTexto = (patch) => dispatch({ type: 'set', next: { ...cfg, text: { ...cfg.text, ...patch } } });

  const ponto = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
  };

  function baixoPonteiro(e) {
    if (!canvasRef.current) return;
    const p = ponto(e);
    const b = caixaRef.current;
    const emTexto = !!cfg.text.value && !!b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    arrasto.current = { modo: emTexto ? 'texto' : 'quadro', ultimo: p, antes: h.present };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function movimento(e) {
    const a = arrasto.current;
    if (!a) return;
    const p = ponto(e);
    const c = canvasRef.current;
    const dx = (p.x - a.ultimo.x) / c.width;
    const dy = (p.y - a.ultimo.y) / c.height;
    a.ultimo = p;
    dispatch({
      type: 'live',
      fn: (k) =>
        a.modo === 'texto'
          ? { ...k, text: { ...k.text, x: k.text.x + dx, y: k.text.y + dy } }
          : { ...k, panX: k.panX + dx, panY: k.panY + dy },
    });
  }

  function soltar() {
    const a = arrasto.current;
    arrasto.current = null;
    if (a) dispatch({ type: 'push', antes: a.antes });
  }

  // Exporta no tamanho real (sem a redução da prévia).
  async function arteFinal(tipo) {
    const { canvas } = renderArt({ img, format: cfg.format, zoom: cfg.zoom, panX: cfg.panX, panY: cfg.panY, adjust: cfg.adjust, text: cfg.text });
    return { canvas, blob: await toBlob(canvas, tipo) };
  }

  async function baixar(tipo) {
    if (!img) return;
    const { blob } = await arteFinal(tipo);
    const base = material.name.replace(/\.[^.]+$/, '');
    downloadBlob(blob, `${base}-editada.${tipo === 'image/png' ? 'png' : 'jpg'}`);
  }

  async function salvar() {
    if (!img) return;
    setSalvando(true);
    try {
      const { canvas, blob } = await arteFinal('image/png');
      const blobKey = crypto.randomUUID();
      await putBlob(blobKey, blob);
      const base = material.name.replace(/\.[^.]+$/, '');
      const entrega = {
        id: crypto.randomUUID(),
        name: `${base}-editada.png`,
        blobKey,
        width: canvas.width,
        height: canvas.height,
        caption: '',
        hashtags: '',
        suggestedDate: '',
      };
      patchOrder(order.id, (o) => addDelivery(o, entrega));
      toast('Arte salva nas entregas do pedido.');
      navigate(`/equipe/pedidos/${order.id}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSalvando(false);
    }
  }

  if (!order || !material) {
    return (
      <main id="main" className="editor">
        <section className="page">
          <Empty title="Não encontramos esta arte.">
            <Link className="btn btn--ghost" to="/equipe">Voltar à fila</Link>
          </Empty>
        </section>
      </main>
    );
  }

  return (
    <main id="main" className="editor">
      <header className="editor__top">
        <Link className="btn btn--ghost" to={`/equipe/pedidos/${order.id}`}>
          <ArrowLeft size={18} aria-hidden="true" /> Voltar ao pedido
        </Link>
        <p className="muted">
          {order.business.name} · {material.name}
        </p>
        <div className="editor__actions">
          <Button variant="ghost" onClick={() => dispatch({ type: 'undo' })} disabled={!h.past.length}>
            <Undo2 size={18} aria-hidden="true" /> Desfazer
          </Button>
          <Button variant="ghost" onClick={() => dispatch({ type: 'redo' })} disabled={!h.future.length}>
            <Redo2 size={18} aria-hidden="true" /> Refazer
          </Button>
        </div>
      </header>

      <div className="editor__body">
        <div className="editor__stage">
          {img ? (
            <canvas
              ref={canvasRef}
              className="editor__canvas"
              role="img"
              aria-label="Prévia da arte. Arraste para ajustar o enquadramento ou o texto."
              onPointerDown={baixoPonteiro}
              onPointerMove={movimento}
              onPointerUp={soltar}
              onPointerCancel={soltar}
            />
          ) : (
            <p className="muted">Carregando a imagem…</p>
          )}
        </div>

        <aside className="editor__panel" aria-label="Ferramentas da arte">
          <div className="editor__group">
            <h2>Enquadramento</h2>
            <Field as="select" label="Formato" value={cfg.format} onChange={(e) => mudar({ format: e.target.value })}>
              {Object.keys(FORMATS).map((f) => (
                <option key={f} value={f}>
                  {f === 'original' ? 'Original' : f}
                </option>
              ))}
            </Field>
            <Field
              type="range"
              min="1"
              max="3"
              step="0.01"
              label={`Zoom (${cfg.zoom.toFixed(2)}×)`}
              value={cfg.zoom}
              onChange={(e) => mudar({ zoom: Number(e.target.value) })}
            />
          </div>

          <div className="editor__group">
            <h2>Ajustes</h2>
            {[
              ['brightness', 'Brilho'],
              ['contrast', 'Contraste'],
              ['saturation', 'Saturação'],
            ].map(([chave, rotulo]) => (
              <Field
                key={chave}
                type="range"
                min="-100"
                max="100"
                step="1"
                label={`${rotulo} (${cfg.adjust[chave]})`}
                value={cfg.adjust[chave]}
                onChange={(e) => mudarAjuste(chave, Number(e.target.value))}
                onDoubleClick={() => mudarAjuste(chave, 0)}
              />
            ))}
            <p className="muted">Duplo clique em um ajuste zera o valor.</p>
          </div>

          <div className="editor__group">
            <h2>Texto</h2>
            <Field
              as="textarea"
              rows={2}
              label="Texto na arte"
              value={cfg.text.value}
              onChange={(e) => mudarTexto({ value: e.target.value })}
              hint="Arraste o texto na imagem para posicionar."
            />
            <Field
              type="range"
              min="0.03"
              max="0.14"
              step="0.005"
              label="Tamanho"
              value={cfg.text.size}
              onChange={(e) => mudarTexto({ size: Number(e.target.value) })}
            />
            <Field type="color" label="Cor do texto" value={cfg.text.color} onChange={(e) => mudarTexto({ color: e.target.value })} />
            <Field as="select" label="Fonte" value={cfg.text.font} onChange={(e) => mudarTexto({ font: e.target.value })}>
              {TEXT_FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Field>
            <label className="check">
              <input type="checkbox" checked={cfg.text.pill} onChange={(e) => mudarTexto({ pill: e.target.checked })} />
              Fundo atrás do texto
            </label>
          </div>

          <div className="editor__group">
            <h2>Exportar e salvar</h2>
            <div className="editor__actions">
              <Button variant="ghost" onClick={() => baixar('image/png')} disabled={!img}>
                <Download size={18} aria-hidden="true" /> Baixar PNG
              </Button>
              <Button variant="ghost" onClick={() => baixar('image/jpeg')} disabled={!img}>
                <Download size={18} aria-hidden="true" /> Baixar JPG
              </Button>
            </div>
            <Button onClick={salvar} loading={salvando} disabled={!img}>
              <Save size={18} aria-hidden="true" /> Salvar como arte do pedido
            </Button>
          </div>
        </aside>
      </div>
    </main>
  );
}
