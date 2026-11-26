---
version: 1
slug: "src-features-entrada-entrada-jsx"
primary_target: "src/features/entrada/Entrada.jsx"
related_targets: []
---

# Entrada (escolha de papel)

Modo da superfície: persuade.
Público: quem quer postar para o próprio negócio (empresário ou dono de negócio) e quem trabalha com as entregas (parceiros da equipe).
Tarefa: escolher o papel e entrar no fluxo certo. As duas ações têm o mesmo peso.
Prova: o produto revela a arte a cada etapa; a entrada já mostra isso no primeiro olhar.
Restrições: sem números, clientes ou depoimentos inventados; textos em português; mobile-first; só tema escuro.
Não mexer: login e cadastro, que vêm depois da escolha.
Decisões em aberto: nenhuma.

## Direction contract

THESIS: O pedido se revela como uma fotografia. A entrada é uma bandeja de revelação azul de cianótipo, e não um título centralizado sobre uma fileira de cards.

OWN-WORLD: Azul-noite (#060B1E) como chão; campos de cianótipo (#143A7A) ocupando a maior parte da tela; texto em papel (#E9F0FF); ação em azul elétrico (#2563EB); cor quente (#FFB86B) reservada ao estado revelado. Bricolage Grotesque no display e Inter no corpo. Materiais: papel fotográfico e grão sutil.

STORY: O visitante entende em uma linha que a marca do negócio vira posts revelados pela equipe. Acredita que acompanha cada etapa. Age: toca numa das duas chapas.

FIRST VIEWPORT: Campo de cianótipo em tela cheia. No topo, no celular, ou à esquerda, no desktop: o título "Sua marca, revelada em posts." em display grande, com uma linha de apoio. Embaixo, no celular, ou à direita, no desktop: duas chapas lado a lado, cada uma com o nome do papel e um botão claro. Atrás das chapas, uma arte se revela em crossfade lento, uma vez por carregamento. Os dois botões têm o mesmo peso.

FORM: Bandeja de revelação, com chapas sobre um campo, e não uma grade de cards. Assinatura: a arte sai do azul e ganha cor quando a chapa é tocada (opacidade, 600 a 800 ms, ease-out). Entrada com ease-out; saída com ease-in e mais curta. Com redução de movimento, só fade de até 120 ms. Posição na lista de formas: única, por escolha do usuário.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

seed: none (direção fixada pelo usuário; sem sorteio)
