import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Logo } from '../../components/Logo.jsx';

// Entrada (Persuade): o campo de cianótipo com as duas chapas. Sem cards iguais em grade.
export function Entrada() {
  return (
    <main id="main" className="entrada">
      <section className="entrada__field" aria-labelledby="titulo-entrada">
        <div className="entrada__copy">
          <Logo />
          <h1 id="titulo-entrada">Sua marca, revelada em posts.</h1>
          <p className="lead">
            Pacotes de publicações feitos pela nossa equipe. Você acompanha cada etapa, do briefing à entrega.
          </p>
        </div>
        <nav className="chapas" aria-label="Escolha o seu acesso">
          <Link to="/cliente/entrar" className="chapa">
            <span className="chapa__art" aria-hidden="true" />
            <span className="chapa__title">Sou empresário(a)</span>
            <span className="chapa__text">Monte o pedido com o briefing e as fotos do negócio, e acompanhe a entrega.</span>
            <span className="chapa__cta">
              Entrar ou criar conta <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>
          <Link to="/equipe/entrar" className="chapa">
            <span className="chapa__art" aria-hidden="true" />
            <span className="chapa__title">Trabalho com as entregas</span>
            <span className="chapa__text">Acesso da equipe. A conta é criada pelo administrador.</span>
            <span className="chapa__cta">
              Entrar na equipe <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>
        </nav>
      </section>
      <section className="entrada__how" aria-labelledby="como-funciona">
        <h2 id="como-funciona">Como funciona</h2>
        <ol className="how">
          <li>Envie o briefing e as fotos do negócio.</li>
          <li>Acompanhe cada etapa e a previsão de entrega.</li>
          <li>Baixe as artes prontas ou peça um ajuste.</li>
        </ol>
      </section>
    </main>
  );
}
