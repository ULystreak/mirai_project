const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const stamp = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const money = (value) => brl.format(value);
export const when = (iso) => (iso ? stamp.format(new Date(iso)) : '—');

// Conversão entre ISO e o valor de <input type="datetime-local"> (hora local).
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
