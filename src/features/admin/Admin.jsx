import { useState } from 'react';
import { Link } from 'react-router';
import { Copy, Trash2 } from 'lucide-react';
import { Button, Dialog, Empty, Field, StatusPill, useAcao, useToast } from '../../components/ui.jsx';
import { createPartner, deletePartner, resetPartnerPassword, setPartnerActive } from '../../lib/auth.js';
import { STATUS, assignOrder, orderStatus } from '../../lib/orders.js';
import { patchOrder, useStore } from '../../lib/store.js';
import { addSampleOrders } from '../../lib/seed.js';

// Administrador: cria, ativa, desativa e redefine a senha dos parceiros, e escolhe quem atende cada pedido.
export function Admin() {
  const partners = useStore((s) => s.partners);
  const orders = useStore((s) => s.orders);
  const toast = useToast();
  const acao = useAcao();
  const [novo, setNovo] = useState({ name: '', username: '' });
  const [erros, setErros] = useState({});
  const [acesso, setAcesso] = useState(null);
  const [excluir, setExcluir] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const equipe = partners.filter((p) => !p.admin);
  const ativos = partners.filter((p) => p.active);

  async function criar(e) {
    e.preventDefault();
    const err = {};
    if (novo.name.trim().length < 3) err.name = 'Informe o nome completo.';
    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(novo.username.trim())) err.username = 'De 3 a 20 letras, números, ponto, traço ou sublinhado.';
    setErros(err);
    if (Object.keys(err).length) return;
    setOcupado(true);
    try {
      const { partner, password } = await createPartner(novo);
      setAcesso({ nome: partner.name, usuario: partner.username, senha: password });
      setNovo({ name: '', username: '' });
      toast(`Conta de ${partner.name} criada.`);
    } catch (ex) {
      setErros({ username: ex.message });
    } finally {
      setOcupado(false);
    }
  }

  async function redefinir(p) {
    const senha = await resetPartnerPassword(p.id);
    setAcesso({ nome: p.name, usuario: p.username, senha });
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      toast('Senha copiada.');
    } catch {
      toast('Não foi possível copiar. Anote a senha.', 'error');
    }
  }

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1>Parceiros e pedidos</h1>
          <p className="lead">Crie as contas da equipe e escolha quem atende cada pedido.</p>
        </div>
        <Button
          variant="ghost"
          type="button"
          onClick={async () => {
            await addSampleOrders();
            toast('Pedidos de exemplo adicionados.');
          }}
        >
          Adicionar pedidos de exemplo
        </Button>
      </header>

      <section className="section" aria-labelledby="criar">
        <h2 id="criar">Criar conta de parceiro</h2>
        <form className="admin-form" onSubmit={criar} noValidate>
          <Field label="Nome" value={novo.name} onChange={(e) => setNovo({ ...novo, name: e.target.value })} error={erros.name} />
          <Field label="Usuário para entrar" autoComplete="off" value={novo.username} onChange={(e) => setNovo({ ...novo, username: e.target.value })} error={erros.username} />
          <Button type="submit" loading={ocupado}>
            Criar conta
          </Button>
        </form>
        {acesso && (
          <div className="credentials" role="status">
            <p>
              Acesso de <strong>{acesso.nome}</strong>. A senha aparece só agora: anote ou copie.
            </p>
            <p>
              Usuário: <strong>{acesso.usuario}</strong>
            </p>
            <p>
              Senha: <strong>{acesso.senha}</strong>
            </p>
            <div className="row-actions">
              <Button variant="ghost" type="button" onClick={() => copiar(acesso.senha)}>
                <Copy size={16} aria-hidden="true" /> Copiar senha
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="equipe">
        <h2 id="equipe">Equipe</h2>
        {equipe.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Usuário</th>
                  <th scope="col">Situação</th>
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {equipe.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="num">{p.username}</td>
                    <td>
                      <StatusPill status={p.active ? 'producao' : 'recusado'} label={p.active ? 'Ativo' : 'Desativado'} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => acao(() => setPartnerActive(p.id, !p.active), p.active ? 'Acesso desativado.' : 'Acesso reativado.')}
                        >
                          {p.active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button variant="ghost" type="button" onClick={() => redefinir(p)}>
                          Nova senha
                        </Button>
                        <Button variant="danger" type="button" onClick={() => setExcluir(p)}>
                          <Trash2 size={16} aria-hidden="true" /> Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Nenhum parceiro ainda.">
            <p className="muted">Crie a primeira conta acima para a equipe começar a aceitar pedidos.</p>
          </Empty>
        )}
      </section>

      <section className="section" aria-labelledby="pedidos">
        <h2 id="pedidos">Pedidos e responsáveis</h2>
        {orders.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Negócio</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = orderStatus(o);
                  return (
                    <tr key={o.id}>
                      <td>
                        <Link to={`/equipe/pedidos/${o.id}`}>{o.business.name}</Link>
                      </td>
                      <td>
                        <StatusPill status={st} label={STATUS[st]} />
                      </td>
                      <td>
                        <select
                          className="select-inline"
                          aria-label={`Responsável por ${o.business.name}`}
                          value={o.assigneeId ?? ''}
                          onChange={(e) => patchOrder(o.id, (x) => assignOrder(x, e.target.value || null))}
                        >
                          <option value="">Sem responsável</option>
                          {ativos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Nenhum pedido ainda." />
        )}
      </section>

      <Dialog open={!!excluir} onClose={() => setExcluir(null)} title="Excluir parceiro?">
        {excluir && (
          <div className="dialog__body">
            <p>
              {excluir.name} perde o acesso. Os pedidos dela voltam para a fila, sem responsável.
            </p>
            <div className="dialog__actions">
              <Button variant="ghost" type="button" onClick={() => setExcluir(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                type="button"
                onClick={() => {
                  deletePartner(excluir.id);
                  setExcluir(null);
                  toast('Parceiro excluído.');
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
