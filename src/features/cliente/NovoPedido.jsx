import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Plus, Trash2, Upload, X } from 'lucide-react';
import { Arte, Bar, Button, Field, useToast } from '../../components/ui.jsx';
import { PACKAGES, POST_TYPES, SEGMENTS, STYLES, estimateHours } from '../../data/catalog.js';
import { currentUser } from '../../lib/auth.js';
import { money } from '../../lib/format.js';
import { createOrder } from '../../lib/orders.js';
import { delBlob, prepareImage, putBlob } from '../../lib/media.js';
import { setState, useStore } from '../../lib/store.js';
import { formatDays, formatHours } from '../../lib/time.js';

const STEPS = ['Negócio', 'Identidade', 'Pacote e posts', 'Materiais', 'Revisão'];

const VAZIO = {
  step: 0,
  business: { name: '', segment: '', city: '', whatsapp: '', instagram: '', site: '', hours: '' },
  identity: { colors: [], styles: [], tone: '', keywords: '', avoid: '' },
  packageId: '',
  posts: [],
  dueWanted: '',
  materials: [],
};

// O rascunho fica salvo no navegador: recarregar a página não perde o que já foi preenchido.
const alterarRascunho = (userId, fn) =>
  setState((s) => ({ ...s, drafts: { ...s.drafts, [userId]: fn(s.drafts[userId] ?? VAZIO) } }));

function validar(d, step) {
  const e = {};
  if (step === 0) {
    if (d.business.name.trim().length < 2) e.name = 'Informe o nome do negócio.';
    if (!d.business.segment) e.segment = 'Escolha um segmento.';
    if (!d.business.city.trim()) e.city = 'Informe a cidade.';
    if (d.business.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'Use DDD e número, por exemplo (11) 90000-0000.';
  }
  if (step === 1 && !d.identity.styles.length) e.styles = 'Escolha pelo menos um estilo.';
  if (step === 2) {
    if (!d.packageId) e.packageId = 'Escolha um pacote.';
    d.posts.forEach((p, i) => {
      if (!p.type) e[`type${i}`] = `Escolha o tipo do post ${i + 1}.`;
      if (p.brief.trim().length < 10) e[`brief${i}`] = `Descreva o post ${i + 1} com pelo menos 10 caracteres.`;
    });
  }
  if (step === 3 && !d.materials.length) e.materials = 'Envie pelo menos uma foto, logo ou material.';
  return e;
}

export function NovoPedido() {
  const user = useStore(currentUser);
  const draft = useStore((s) => s.drafts[user?.id] ?? VAZIO);
  const navigate = useNavigate();
  const toast = useToast();
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const { step } = draft;
  const pkg = PACKAGES.find((p) => p.id === draft.packageId);

  const set = (fn) => alterarRascunho(user.id, fn);
  const setNegocio = (chave, valor) => set((d) => ({ ...d, business: { ...d.business, [chave]: valor } }));
  const setIdentidade = (patch) => set((d) => ({ ...d, identity: { ...d.identity, ...patch } }));
  const setPost = (i, patch) => set((d) => ({ ...d, posts: d.posts.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const setDue = (valor) => set((d) => ({ ...d, dueWanted: valor }));

  function escolherPacote(id) {
    const p = PACKAGES.find((x) => x.id === id);
    set((d) => ({
      ...d,
      packageId: id,
      posts: Array.from({ length: p.posts }, (_, i) => d.posts[i] ?? { type: '', brief: '' }),
    }));
  }

  async function adicionar(lista) {
    for (const file of Array.from(lista ?? [])) {
      try {
        const { blob, width, height } = await prepareImage(file);
        const blobKey = crypto.randomUUID();
        await putBlob(blobKey, blob);
        set((d) => ({ ...d, materials: [...d.materials, { id: crypto.randomUUID(), name: file.name, blobKey, width, height }] }));
      } catch (err) {
        toast(err.message, 'error');
      }
    }
    setErros((e) => ({ ...e, materials: undefined }));
  }

  function remover(m) {
    set((d) => ({ ...d, materials: d.materials.filter((x) => x.id !== m.id) }));
    delBlob(m.blobKey);
  }

  function avancar() {
    const e = validar(draft, step);
    setErros(e);
    if (Object.keys(e).length) {
      toast('Confira os campos destacados.', 'error');
      return;
    }
    setErros({});
    set((d) => ({ ...d, step: d.step + 1 }));
    window.scrollTo({ top: 0 });
  }

  function voltar() {
    setErros({});
    set((d) => ({ ...d, step: Math.max(0, d.step - 1) }));
  }

  async function enviar() {
    setEnviando(true);
    try {
      const order = createOrder({
        id: crypto.randomUUID(),
        clientId: user.id,
        business: { ...draft.business },
        identity: { ...draft.identity },
        pkg,
        posts: draft.posts.map((p) => ({ id: crypto.randomUUID(), ...p })),
        materials: draft.materials.map((m) => ({ ...m })),
        dueWanted: draft.dueWanted ? new Date(`${draft.dueWanted}T18:00:00`).toISOString() : null,
      });
      setState((s) => {
        const { [user.id]: _rascunho, ...restantes } = s.drafts;
        return { ...s, orders: [...s.orders, order], drafts: restantes };
      });
      toast('Pedido enviado. A equipe já pode aceitar.');
      navigate(`/cliente/pedidos/${order.id}`);
    } catch (err) {
      toast(err.message, 'error');
      setEnviando(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (step < STEPS.length - 1) avancar();
    else enviar();
  }

  return (
    <section className="wizard">
      <header className="wizard__progress">
        <div className="wizard__head">
          <h1>Novo pedido</h1>
          <p className="muted num">
            Passo {step + 1} de {STEPS.length} · {STEPS[step]}
          </p>
        </div>
        <Bar value={(step + 1) / STEPS.length} label="Progresso do pedido" />
      </header>

      <form className="wizard__form" onSubmit={onSubmit} noValidate>
        {step === 0 && <PassoNegocio negocio={draft.business} erros={erros} set={setNegocio} />}
        {step === 1 && <PassoIdentidade identidade={draft.identity} erros={erros} set={setIdentidade} />}
        {step === 2 && <PassoPacote draft={draft} erros={erros} escolher={escolherPacote} setPost={setPost} setDue={setDue} />}
        {step === 3 && <PassoMateriais materiais={draft.materials} erro={erros.materials} adicionar={adicionar} remover={remover} />}
        {step === 4 && <PassoRevisao draft={draft} pkg={pkg} />}

        <div className="wizard__nav">
          {step > 0 ? (
            <Button variant="ghost" type="button" onClick={voltar}>
              <ArrowLeft size={18} aria-hidden="true" /> Voltar
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="submit">
              Continuar <ArrowRight size={18} aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" loading={enviando}>
              Pagar {money(pkg?.price ?? 0)} (simulado)
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

function PassoNegocio({ negocio: b, erros, set }) {
  return (
    <div className="grid-2">
      <Field label="Nome do negócio" name="negocio" autoComplete="organization" value={b.name} onChange={(e) => set('name', e.target.value)} error={erros.name} />
      <Field as="select" label="Segmento" name="segmento" value={b.segment} onChange={(e) => set('segment', e.target.value)} error={erros.segment}>
        <option value="">Escolha um segmento</option>
        {SEGMENTS.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Field>
      <Field label="Cidade" name="cidade" autoComplete="address-level2" value={b.city} onChange={(e) => set('city', e.target.value)} error={erros.city} />
      <Field label="WhatsApp" name="whatsapp" type="tel" autoComplete="tel" value={b.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} error={erros.whatsapp} hint="Com DDD." />
      <Field label="Instagram" name="instagram" value={b.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@seunegocio" />
      <Field label="Site (opcional)" name="site" type="url" value={b.site} onChange={(e) => set('site', e.target.value)} />
      <Field label="Horário de funcionamento" name="horario" value={b.hours} onChange={(e) => set('hours', e.target.value)} placeholder="Seg a sex, 9h às 18h" />
    </div>
  );
}

function PassoIdentidade({ identidade: i, erros, set }) {
  const alternarEstilo = (estilo) =>
    set({ styles: i.styles.includes(estilo) ? i.styles.filter((x) => x !== estilo) : [...i.styles, estilo] });
  return (
    <div className="wizard__form">
      <fieldset className="fieldset">
        <legend>Cores da marca (até 3)</legend>
        <div className="chips">
          {i.colors.map((cor, idx) => (
            <span key={idx} className="chips">
              <input type="color" value={cor} aria-label={`Cor ${idx + 1}`} onChange={(e) => set({ colors: i.colors.map((c, j) => (j === idx ? e.target.value : c)) })} />
              <button type="button" className="icon-btn" aria-label={`Remover cor ${idx + 1}`} onClick={() => set({ colors: i.colors.filter((_, j) => j !== idx) })}>
                <X size={16} aria-hidden="true" />
              </button>
            </span>
          ))}
          {i.colors.length < 3 && (
            <Button variant="ghost" type="button" onClick={() => set({ colors: [...i.colors, '#2563EB'] })}>
              <Plus size={18} aria-hidden="true" /> Adicionar cor
            </Button>
          )}
        </div>
      </fieldset>
      <fieldset className="fieldset">
        <legend>Estilo</legend>
        <div className="chips">
          {STYLES.map((estilo) => (
            <button key={estilo} type="button" className="chip" aria-pressed={i.styles.includes(estilo)} onClick={() => alternarEstilo(estilo)}>
              {estilo}
            </button>
          ))}
        </div>
        {erros.styles && <p className="field__error" role="alert">{erros.styles}</p>}
      </fieldset>
      <Field as="textarea" rows={2} label="Tom de voz" hint="Como a marca fala: próxima, formal, divertida." value={i.tone} onChange={(e) => set({ tone: e.target.value })} />
      <Field label="Palavras-chave" hint="Separe por vírgulas." value={i.keywords} onChange={(e) => set({ keywords: e.target.value })} />
      <Field label="O que evitar" value={i.avoid} onChange={(e) => set({ avoid: e.target.value })} />
    </div>
  );
}

function PassoPacote({ draft, erros, escolher, setPost, setDue }) {
  return (
    <div className="wizard__form">
      <fieldset className="fieldset">
        <legend>Pacote</legend>
        <div className="pkgs">
          {PACKAGES.map((p) => (
            <label key={p.id} className="pkg">
              <input type="radio" name="pacote" value={p.id} checked={draft.packageId === p.id} onChange={() => escolher(p.id)} />
              <strong>{p.name}</strong>
              <span>{p.posts} posts por ciclo</span>
              <span className="pkg__price">{money(p.price)}</span>
              <span className="muted">{p.note}</span>
            </label>
          ))}
        </div>
        {erros.packageId && <p className="field__error" role="alert">{erros.packageId}</p>}
      </fieldset>
      {draft.posts.length > 0 && (
        <fieldset className="fieldset">
          <legend>Os posts do pacote</legend>
          <ol className="posts-list">
            {draft.posts.map((p, i) => (
              <li key={i} className="post">
                <Field as="select" label={`Tipo do post ${i + 1}`} value={p.type} onChange={(e) => setPost(i, { type: e.target.value })} error={erros[`type${i}`]}>
                  <option value="">Escolha o tipo</option>
                  {POST_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Field>
                <Field as="textarea" rows={3} label={`O que mostrar no post ${i + 1}`} value={p.brief} onChange={(e) => setPost(i, { brief: e.target.value })} error={erros[`brief${i}`]} />
              </li>
            ))}
          </ol>
        </fieldset>
      )}
      <Field type="date" label="Preciso das artes até (opcional)" value={draft.dueWanted} onChange={(e) => setDue(e.target.value)} hint="Comparamos essa data com a previsão da equipe." />
    </div>
  );
}

function PassoMateriais({ materiais, erro, adicionar, remover }) {
  const [sobre, setSobre] = useState(false);
  return (
    <div className="wizard__form">
      <div
        className="drop"
        data-over={sobre}
        onDragOver={(e) => {
          e.preventDefault();
          setSobre(true);
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSobre(false);
          adicionar(e.dataTransfer.files);
        }}
      >
        <p>Arraste aqui as fotos do negócio, o logo e outros materiais.</p>
        <p className="muted">JPG, PNG ou WebP, até 10 MB cada. Reduzimos o tamanho automaticamente.</p>
        <label className="btn btn--ghost file-btn">
          <Upload size={18} aria-hidden="true" /> Escolher arquivos
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              adicionar(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {erro && <p className="field__error" role="alert">{erro}</p>}
      {materiais.length > 0 && (
        <ul className="thumbs">
          {materiais.map((m) => (
            <li key={m.id} className="thumb">
              <Arte blobKey={m.blobKey} alt={m.name} />
              <p className="thumb__name">{m.name}</p>
              <Button variant="danger" type="button" onClick={() => remover(m)}>
                <Trash2 size={16} aria-hidden="true" /> Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PassoRevisao({ draft, pkg }) {
  const horas = pkg ? estimateHours(pkg.posts) : 0;
  const vencimento = draft.dueWanted ? new Date(`${draft.dueWanted}T12:00:00`).toLocaleDateString('pt-BR') : '';
  return (
    <div className="review">
      <dl className="kv">
        <dt>Negócio</dt>
        <dd>{draft.business.name}</dd>
        <dt>Segmento</dt>
        <dd>{draft.business.segment}</dd>
        <dt>Cidade</dt>
        <dd>{draft.business.city}</dd>
        <dt>Pacote</dt>
        <dd>{pkg ? `${pkg.name}, ${pkg.posts} posts, ${money(pkg.price)}` : '—'}</dd>
        <dt>Materiais</dt>
        <dd className="num">
          {draft.materials.length} arquivo{draft.materials.length === 1 ? '' : 's'}
        </dd>
        <dt>Trabalho previsto</dt>
        <dd className="num">
          {formatHours(horas)} · {formatDays(horas)}
        </dd>
        {vencimento && (
          <>
            <dt>Artes até</dt>
            <dd className="num">{vencimento}</dd>
          </>
        )}
      </dl>
      <p className="muted">Pagamento simulado: nenhuma cobrança real é feita nesta prévia.</p>
    </div>
  );
}
