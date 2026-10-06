---
target: Painel de Gestão MBS, produto real em /gestao
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
timestamp: 2026-10-02T14-46-24Z
slug: web-app-gestao-page-tsx
---
# Crítica — Painel de Gestão MBS (Gestão e produto)

Veredito: não aprovado. Remover o logo deixa um dashboard SaaS. Não há momento WOW.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Seção, período e país estão visíveis; o medidor nasce em 0,0% e a agulha mente acima de 150%. |
| 2 | Match System / Real World | 3 | A língua do CSC está certa; o botão diz Paraguai e o globo diz Hub Latam. |
| 3 | User Control and Freedom | 2 | Dá para trocar seção e país; o diálogo de Operacionais nasce dentro do main com filter e o foco não entra nele. |
| 4 | Consistency and Standards | 2 | Gestão é uma página editorial; Operacionais, Exportação e SAC são o mesmo grid de cards, com dois medidores. |
| 5 | Error Prevention | 2 | A escala trava em 150% com o rótulo em 207,6%; o vazio de Qualidade ainda desenha um arco colorido. |
| 6 | Recognition Rather Than Recall | 2 | SAC herda a geografia na URL e não mostra o seletor; comparar países exige memória. |
| 7 | Flexibility and Efficiency | 1 | Não há busca, atalho de país nem forma de isolar o que está fora da meta. |
| 8 | Aesthetic and Minimalist Design | 2 | Volumetria tem um protagonista; em seguida quinze arcos arco-íris e um grid de cards disputam o mesmo peso. |
| 9 | Error Recovery | 2 | Exportação consolidada repete a instrução; Qualidade, ligação do SAC e YTD vazio são um traço. |
| 10 | Help and Documentation | 1 | O tooltip repete Mês, Meta e YTD; nada explica a cor do desvio. |
| **Total** | | **19/40** | **Poor** |

## Design Specificity Verdict

Category-interchangeable. O teste de 3 segundos em Gestão cai no logo e no 372. Em Operacionais e SAC cai em cards. A resposta é dashboard.

O modo de falha está presente: campo #f4f7fa, bloco azul, números grandes, medidores verde-amarelo-vermelho (#99B81D, #FBDF00, #B90302), trilho com lista e uma esfera escura. Montserrat, o wordmark, o fio dourado e os PNGs oficiais estão pousados em cima desse template.

Deterministic scan: detect.mjs em web/app e web/components saiu 0, JSON []. O overlay no navegador pegou o que o CLI não pegou: Montserrat como overused-font (falso positivo de marca; a face é a oficial), em-dash em Gestão (40, em grande parte placeholders), low-contrast em “2026” (text-azul-claro) e em YTD vermelho de 13px no SAC, skipped heading no SAC (h1 depois h3), e a coluna do shell esticando o primeiro viewport.

## Overall Impression

Há uma tentativa real em Volumetria: Colaboradores não é um card branco, e as outras três colunas são tipografia aberta com régua e barra de desvio. Isso não salva o produto. O instrumento que decide o mês — Custo a 148,8% da meta — é um velocímetro de painel de carro. O objeto que deveria ser a assinatura é uma esfera de 192px no rodapé do trilho.

## What's Working

- Volumetria não é quatro cards brancos iguais. O 372 tem escala; Transações e os orçamentos são colunas, não caixas.
- A visão geográfica sobrevive na query entre Gestão e Operacionais. Exportação troca o controle para Brasil / Hub Latam em vez de inventar um consolidado.
- O diálogo operacional fala a língua do diretor: Fora da meta, Dentro, Fora, Volume, série do ano, Anterior / Próximo.

## Priority Issues

### [P1] A composição continua sendo um dashboard corporativo
Gestão é um trilho mais um miolo. Operacionais e SAC são cards brancos rounded-xl com shadow-lift. Exportação vazia é a mesma frase duas vezes num campo morto, com a tagline e os cinco valores oficiais flutuando no vazio.
Por que importa: um diretor não reconhece um produto da casa. Reconhece um fechamento que aceita outro logo.
Fix: uma linguagem só para as quatro seções. O miolo é um livro de leitura, não uma grade. O PNG de valores não muda de cor; sai de adesivo de rodapé e deixa de preencher o vazio.

### [P1] O globo é uma esfera que gira
Cena Three.js: duas esferas, dois toros, dois pontos, um arco dourado e um viajante que só aparece no consolidado por 2,2s a cada 11s. Brasil e Paraguai só escalam o ponto e giram o grupo até a coordenada. A legenda diz Hub Latam quando o botão diz Paraguai. Em 906px de altura a legenda senta na base do trilho.
Por que importa: o gesto central do produto (trocar país) quase não muda o objeto que deveria representá-lo.
Fix: o objeto ocupa o trilho como estrutura. Brasil é um enquadramento, Paraguai é outro, Consolidado é a relação entre os dois, com a câmera animada. A legenda usa o mesmo nome do controle da página.

### [P1] Custo, Produtividade e Qualidade não são um sistema, e a escala mente
Medidor estratégico é arco-íris completo. Gauge operacional é arco curto na cor do status. A posição é Math.min(150, …): Transações Financeiras / Custo mostra 207,6% com a agulha no fim da escala. Qualidade sem dado desenha o arco-íris inteiro e um travessão. Táticos repetem o mesmo arco doze vezes.
Por que importa: não dá para varrer “o que está fora” num olhar, e um custo a 207% parece igual a um custo a 150%.
Fix: um instrumento só, da estratégica ao card. Mesma escala, mesma codificação, mesmo vazio. Meta ausente é um vão, não um arco colorido. Acima de 150% a escala continua e o número desenhado continua sendo o da API.

### [P1] Os KPIs ainda não são uma experiência de dado
A comparação ano contra ano é um fio de 1px e um traço de 3px. O desvio de orçamento é uma barra de 3px; +48,8% contra o previsto exige leitura. Orçamento Previsto sem base é a frase “Sem base em 2025”. O grid xl:grid-cols-4 ao lado do trilho de 20rem é o ponto em que o 372 deixa de caber; em 1247px, abaixo desse breakpoint, a faixa em duas colunas ainda se lê.
Por que importa: a situação do mês não aparece antes do texto.
Fix: uma peça de volumetria, não quatro colunas iguais. A figura de Colaboradores pede a largura do tipo. A comparação ano contra ano fica visível. O orçamento comunica a situação antes dos rótulos. A ausência de base é um estado composto, sem número inventado.

### [P1] As outras seções trocam de produto, e o detalhe abre no lugar errado
Operacionais é uma parede de cards iguais: 17,7% (Fora 1.557) tem o mesmo desenho que 100,0%. SAC repete o card; “Tempo de Atendimento - Ligação” é um traço vermelho e “YTD —”, e a página não mostra o país mesmo com visao=PY na URL. O diálogo é position:fixed dentro de motion.main, que termina com filter: blur(0px). Filter cria containing block: o diálogo se centra na coluna, não na janela, e o foco não entra nele.
Por que importa: o único detalhe do indicador fora da meta exige procurar a camada, e Gestão → Operacionais → SAC não parece a mesma aplicação.
Fix: as três seções usam o livro de Gestão. Fora da meta ocupa a linha; no alvo fica quieto. O diálogo vai para document.body, fora do main filtrado, e o foco entra nele. A transição de rota deixa de ser fade, 8px e blur.

## Persona Red Flags

Alex (diretor de operações): não isola fora da meta. O período é só leitura. Não há atalho Brasil / Paraguai / Consolidado. O custo a 207,6% compartilha o fim da escala com o custo a 150%.

Sam (teclado): o canvas é aria-hidden. O tooltip do medidor é aria-hidden. O diálogo não recebe foco e não está na janela. O desvio bom/ruim está na cor. “2026” em azul-claro de 11px falha contraste. SAC salta de h1 para h3.

Riley (vazio e troca de país): Qualidade é um arco colorido com travessão. Exportação em BR+PY não pressiona nenhum botão e repete a frase. SAC não declara a geografia herdada. A troca de país atualiza o número e quase não muda a esfera.

## Cognitive load

6 de 8 falham. Carga alta. Passam agrupamento e quantidade de destinos (4 seções, 3 visões). Falham foco único, chunking (4 setores × 3 métricas, e dezenas de cards operacionais), hierarquia (o desvio perde para o número grande), uma coisa de cada vez, memória entre países, e disclosure (tudo nasce aberto; o segundo nível abre fora da vista).

## Emotional journey

Pico de um segundo: wordmark e o bloco do 372. Vale: a fazenda de arcos, o grid de cards, e o fim em Exportação vazia ou no traço do SAC. O fim é o vale.

## Minor Observations

- Campo do miolo #f4f7fa, fora da paleta. O branco não chega à metade de Gestão.
- Ícones são traços genéricos de biblioteca (stroke 2), não o outline leve da marca.
- Grafismo M está a 4% de opacidade, como marca d’água, e não estrutura nada.
- prefers-reduced-motion zera duração para 0,01ms em tudo.
- O globo roda useFrame o tempo todo para um objeto que não ganhou a cena.
- Pesos 700–900 de Montserrat estavam unloaded na sessão observada; 300–600 estavam loaded.
- O selo “2 Issues” no canto é o overlay do Next.js em desenvolvimento, não é interface do produto.

## Questions to Consider

- Se o gesto do produto é escolher Brasil, Paraguai ou Consolidado, por que a esfera continua igual?
- A leitura das 8h é o 372 ou o custo a 148,8% da meta? O desenho responde o 372.
- Custo, Produtividade e Qualidade cabem num instrumento da casa, ou continuam quinze velocímetros?
- O que se perde se a tagline deixar de ser adesivo e a ausência de dado passar a ser uma cena?
