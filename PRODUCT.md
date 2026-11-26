# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite, em JavaScript (JSX), sem TypeScript. Persistência local: localStorage para o estado e IndexedDB para as imagens. Sem backend nesta fase.

## Users

- **Empresário ou dono de negócio:** pequeno negócio sem orçamento para social media. Cria conta, preenche o briefing, envia fotos e materiais, escolhe um pacote de publicações e acompanha a entrega pelo celular.
- **Parceiro da equipe de entregas:** entra só com login; a conta é criada pelo admin. Trabalha em computador: vê a fila, aceita ou recusa pedidos, define prazos, edita as artes e envia a entrega final.
- **Admin (`mirai`):** cria, ativa, desativa e redefine a senha dos parceiros, e reatribui pedidos.

## Product Purpose

Vender pacotes de publicações para pequenos negócios que não têm equipe de social media. O cliente recebe artes prontas, com prazos claros e acompanhamento transparente.

Sucesso para o cliente: saber em que etapa está e quando recebe. Sucesso para a equipe: ver a fila, cumprir prazos e entregar sem idas e vindas.

Esta versão é uma prévia funcional do frontend. Tudo funciona no navegador, sem backend.

## Positioning

Acompanhar um pedido de arte como um pedido de delivery: etapas com mensagens claras ("Aceitamos o seu projeto", "Editando as imagens", "Entrega final") e previsão total de entrega. Cada pacote tem quantidade de posts e valor definidos.

## Operating Context

- O cliente monta o pedido em 5 passos: negócio, identidade, pacote e posts, materiais, revisão e pagamento simulado.
- A equipe edita as artes num editor básico (proporção, ajustes de cor, texto) e baixa os arquivos individualmente ou em .zip.
- Entrega: arquivos prontos (PNG ou JPG), com legenda, hashtags e data sugerida de postagem. O cliente baixa, aprova ou pede ajuste.

## Capabilities and Constraints

- Os dados ficam no navegador. Cliente e equipe se veem no mesmo navegador (abas diferentes), não entre aparelhos diferentes.
- Autenticação simulada: senhas guardadas como hash SHA-256 no navegador. A senha do admin de demonstração fica no código.
- Pagamento simulado, sem cobrança real. Sem publicação nas redes sociais.
- Sem app de loja. Instalável como atalho (manifest); sem service worker.
- Imagens: até 10 MB por arquivo, comprimidas para 2048 px.
- Prazos em horas úteis (seg a sex, 9h às 18h).
- Idioma: português (Brasil).
- Decisão em aberto: os pacotes e valores (Pequeno, 4 posts, R$ 89; Essencial, 8 posts, R$ 149; Crescimento, 16 posts, R$ 269) são exemplos, editáveis em um arquivo.

## Brand Commitments

- Nome de trabalho: Mirai (pasta do projeto e login do admin). Pode mudar.

## Evidence on Hand

- Nenhum depoimento, cliente, resultado ou benchmark. Não criar nenhum.
- Materiais de demonstração (artes e logo) são gerados em código e rotulados como "exemplo".

## Product Principles

1. O cliente sempre sabe a etapa atual, o que vem depois e a previsão.
2. Os prazos vêm de horas úteis, e atrasos aparecem como atrasos.
3. Tudo que aparece na tela funciona. Limitações (sem backend, sem pagamento real) são declaradas, não escondidas.
4. Quem trabalha na equipe tem informação densa e precisa; quem acompanha o pedido tem uma leitura simples.

## Accessibility & Inclusion

- Linguagem simples, em português do Brasil, com textos curtos.
- Contraste mínimo de 4,5:1 no texto, foco visível, alvos de toque de 44 px e respeito à preferência de reduzir movimento.
