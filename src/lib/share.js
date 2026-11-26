// Copiar e compartilhar. Usa as APIs do navegador quando existem e cai para um caminho simples quando não existem.

// Texto pronto para postar: a legenda e, logo depois, as hashtags.
export const legendaCompleta = (arte) => [arte.caption, arte.hashtags].filter(Boolean).join('\n\n');

// Copia um texto. Sem a API de área de transferência (página sem contexto seguro), usa o método antigo.
export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = Object.assign(document.createElement('textarea'), { value: texto, readOnly: true });
    Object.assign(area.style, { position: 'fixed', opacity: '0' });
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

// Abre a folha de compartilhamento do sistema com o arquivo.
// Devolve 'ok', 'cancelado' (a pessoa fechou a folha) ou 'sem-suporte' (o navegador não compartilha arquivos).
export async function compartilharArquivo({ file, title, text }) {
  if (!navigator.share || !navigator.canShare?.({ files: [file] })) return 'sem-suporte';
  try {
    await navigator.share({ files: [file], title, text });
    return 'ok';
  } catch (err) {
    return err.name === 'AbortError' ? 'cancelado' : 'sem-suporte';
  }
}
