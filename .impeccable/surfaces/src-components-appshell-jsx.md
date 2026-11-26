---
version: 1
slug: "src-components-appshell-jsx"
primary_target: "src/components/AppShell.jsx"
related_targets: []
---

# App (painéis, wizard, acompanhamento e editor)

Modo da superfície: operate.
Público: cliente que acompanha pedidos; parceiros da equipe que trabalham em fila; admin.
Tarefas: o cliente monta o pedido, acompanha prazos e aprova entregas; a equipe aceita ou recusa, define prazos, conclui etapas, edita e entrega; o admin cria parceiros.
Restrições: navegação e controles padrão da web; filas e tabelas com estados claros; português; mobile-first; barra lateral a partir de 1024 px.
Não mexer: nada de ornamento do mundo nas telas de trabalho.
Decisões em aberto: nenhuma.

## Direction contract

THESIS: Ferramenta de trabalho primeiro. O mundo cianótipo entra só como azul de superfície, tipografia, densidade e um movimento de assinatura: a revelação do progresso.

OWN-WORLD: Superfícies em azul-noite (#060B1E e #0C1733); azul de ação (#2563EB) só na ação primária; estados em cores funcionais (âmbar para entregue, coral para atrasado); Bricolage Grotesque nos títulos e Inter nos dados, com números tabulares.

STORY: O cliente lê o estado e a previsão em segundos e faz a próxima ação. A equipe vê a fila e o prazo mais próximo, e age sem procurar.

FIRST VIEWPORT: Shell primeiro. Barra lateral com texto e ícone a partir de 1024 px; barra inferior no celular. Área principal com o título da página, filtros e a lista ou o pedido aberto. O primeiro dado lido é a etapa atual e a previsão. A assinatura aparece dentro do cartão do pedido, nunca solta na tela.

FORM: Painel padrão com área de trabalho. Ordem de leitura: estado, prazo, ação. Densidade média, com espaçamento de 8 px e linhas de tabela de 48 px. Assinatura: a revelação do progresso no cartão do pedido (opacidade, ease-out, 400 ms). Transições de tela até 400 ms; listas com stagger de 40 ms; só transform e opacity animados. Acabamento: grade alinhada, escala tipográfica real, hierarquia clara. Posição na lista de formas: única, por escolha do usuário.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

seed: none (direção fixada pelo usuário; sem sorteio)
