// Horas úteis: seg a sex, 9h às 18h. ponytail: fuso do navegador e sem feriados.
export const DAY_START = 9;
export const DAY_END = 18;
export const HOURS_PER_DAY = DAY_END - DAY_START;

const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

// Primeiro instante útil em ou depois de `d`.
function workStart(d) {
  const t = new Date(d);
  if (t.getHours() < DAY_START) t.setHours(DAY_START, 0, 0, 0);
  else if (t.getHours() >= DAY_END) {
    t.setDate(t.getDate() + 1);
    t.setHours(DAY_START, 0, 0, 0);
  }
  while (isWeekend(t)) {
    t.setDate(t.getDate() + 1);
    t.setHours(DAY_START, 0, 0, 0);
  }
  return t;
}

// Soma `hours` de trabalho útil a partir de `from`.
export function addBusinessHours(from, hours) {
  let t = workStart(from);
  let left = Math.round(hours * 3600_000);
  while (left > 0) {
    const end = new Date(t);
    end.setHours(DAY_END, 0, 0, 0);
    const room = end - t;
    if (left <= room) {
      t = new Date(t.getTime() + left);
      left = 0;
    } else {
      left -= room;
      t = workStart(end);
    }
  }
  return t;
}

export const formatHours = (h) => `${(Math.round(h * 10) / 10).toLocaleString('pt-BR')} h úteis`;
export const formatDays = (h) => {
  const days = Math.max(1, Math.ceil(h / HOURS_PER_DAY));
  return `${days} ${days === 1 ? 'dia útil' : 'dias úteis'}`;
};

// Contagem até `target` em tempo corrido, para o cliente ver quanto falta.
export function countdown(target, now = new Date()) {
  const ms = new Date(target) - now;
  const mins = Math.floor(Math.abs(ms) / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const span = d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
  return ms < 0 ? `atrasado há ${span}` : `faltam ${span}`;
}
