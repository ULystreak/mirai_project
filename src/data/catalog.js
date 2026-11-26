// Pacotes, etapas e listas de opções. Valores de exemplo, editáveis aqui.
export const PACKAGES = [
  { id: 'pequeno', name: 'Pequeno', posts: 4, price: 89, note: 'Quatro posts para começar a aparecer.' },
  { id: 'essencial', name: 'Essencial', posts: 8, price: 149, note: 'Oito posts para manter a presença.' },
  { id: 'crescimento', name: 'Crescimento', posts: 16, price: 269, note: 'Dezesseis posts por ciclo.' },
];

// `hours` devolve as horas úteis de trabalho da etapa, dado o número de posts.
export const STAGES = [
  { key: 'recebido', label: 'Pedido recebido', message: 'Recebemos o seu briefing e os materiais.', hours: () => 0 },
  { key: 'aceito', label: 'Aceitamos o seu projeto', message: 'Um parceiro da equipe vai assumir o seu pedido.', hours: () => 4 },
  { key: 'edicao', label: 'Editando as imagens', message: 'Recorte, cor e ajustes em cada arte.', hours: (n) => 2 * n },
  { key: 'legendas', label: 'Criando as legendas', message: 'Textos e hashtags no tom da sua marca.', hours: (n) => 0.5 * n },
  { key: 'revisao', label: 'Revisão final', message: 'Conferimos cada post antes da entrega.', hours: () => 2 },
  { key: 'entrega', label: 'Entrega final', message: 'Suas artes estão prontas para baixar.', hours: () => 1 },
];

export const estimateHours = (posts) => STAGES.reduce((total, s) => total + s.hours(posts), 0);

export const POST_TYPES = ['Promoção', 'Produto', 'Bastidores', 'Depoimento', 'Data especial'];
export const SEGMENTS = ['Alimentação', 'Moda', 'Beleza', 'Serviços', 'Saúde', 'Educação', 'Varejo', 'Outro'];
export const STYLES = ['Moderno', 'Elegante', 'Divertido', 'Minimalista', 'Clássico', 'Ousado'];
export const TEXT_FONTS = [
  { id: 'display', label: 'Bricolage Grotesque', family: '"Bricolage Grotesque Variable", sans-serif' },
  { id: 'texto', label: 'Inter', family: '"Inter Variable", sans-serif' },
];
