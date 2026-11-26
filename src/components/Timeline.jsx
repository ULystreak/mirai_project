import { Check } from 'lucide-react';
import { cx } from './ui.jsx';
import { isLate } from '../lib/orders.js';
import { when } from '../lib/format.js';

// Linha do tempo estilo entrega de delivery: a linha "imprime" a cada etapa concluída.
export function Timeline({ order, now }) {
  const current = order.stages.find((s) => !s.doneAt);
  return (
    <ol className="timeline">
      {order.stages.map((s, i) => {
        const done = !!s.doneAt;
        const late = isLate(s, now);
        return (
          <li key={s.key} className={cx('step', done && 'step--done', current?.key === s.key && 'step--current')}>
            <span className="step__mark" aria-hidden="true">
              {done ? <Check size={16} strokeWidth={2.2} /> : <span className="step__dot" />}
            </span>
            <div className="step__body">
              <p className="step__title">{s.label}</p>
              <p className="step__meta num">
                {done ? `Concluída em ${when(s.doneAt)}` : s.deadline ? `Previsão: ${when(s.deadline)}` : ''}
              </p>
              {current?.key === s.key && <p className="step__message">{s.message}</p>}
              {late && <p className="step__late">Passou do prazo</p>}
            </div>
            {i < order.stages.length - 1 && <span className="step__fill" style={{ '--done': done ? 1 : 0 }} />}
          </li>
        );
      })}
    </ol>
  );
}
