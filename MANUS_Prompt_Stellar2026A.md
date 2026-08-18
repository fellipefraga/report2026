# PROMPT MANUS — RELATÓRIO STELLAR GAMING 2026A
## Execução completa: identidade visual + insights + gráficos + PPTX

---

## MISSÃO

No projeto **Stellar Report Hub** (https://lovable.dev/projects/9d7ab6f8-b8a7-4394-a3dd-fadb4cf14818), execute as seguintes tarefas em sequência para finalizar o Relatório Stellar Gaming 2026A como apresentação PPTX profissional.

---

## TAREFA 1 — IDENTIDADE VISUAL NOS SLIDES

Aplique a identidade visual Stellar Gaming em TODOS os 81 slides existentes no banco Supabase. A identidade já está no repositório GitHub `fellipefraga/report2026`.

**Especificações obrigatórias por slide:**

```
Background: #0D1117
Cards/surfaces: #1A1A16
Accent principal: #C8F000 (lime)
Positivo/crescimento: #1DB67A (teal)
Alerta/risco: #E55353
Texto primário: #FFFFFF
Texto secundário: #A0A09A

Tipografia:
- Título do slide: Poppins 700, 24-32px
- KPI principal: Poppins 700, 48-64px, cor #C8F000
- Bullets: Inter 400, 14-16px, cor #A0A09A
- Fonte/rodapé: Inter 400, 10px, cor #ffffff30

Elementos obrigatórios em cada slide:
- Badge do bloco (canto superior esquerdo): fundo #C8F000, texto #0D1117, 9px uppercase
- Logo mark "S·" (canto superior direito): Poppins 700, cor #C8F000
- Barra accent esquerda: 4px, cor #C8F000 (exceto slides de capa)
- Rodapé: fonte + número do slide (ex: "14 / 81")
- Delta positivo em #1DB67A, negativo em #E55353
```

---

## TAREFA 2 — CORRIGIR MARKET SHARE (DADO ERRADO NO BANCO)

Localize o slide B2.10 no banco e atualize com os dados corretos:

```sql
UPDATE slides SET
  titulo = 'Betano lidera com 23% — Top 10 concentra 68,8% do GGR',
  kpi_principal = 'Betano 23% · líder disparada',
  bullets = ARRAY[
    'Betano 23,0% | Bet365 20,0% | SportingBet 6,0% | Esportes da Sorte 5,5%',
    'Superbet 5,0% | Blaze 3,0% | Betnacional 2,8% | EstrelaBet 2,0%',
    'Top 10 = 68,8% do GGR · dados 2025 (H2GC + SPA/MF + LCA/IBJR)'
  ],
  fonte_rodape = 'Fonte: H2 Gambling Capital; SPA/MF; LCA/IBJR (2025). Shares além do Top 2 são estimativas.'
WHERE bloco_deck = 'B2.10';
```

---

## TAREFA 3 — CORRIGIR SLIDE DE ALÍQUOTAS (ADICIONAR CARGA TOTAL)

Localize o slide B8.6 e atualize para incluir a carga tributária total:

```sql
UPDATE slides SET
  titulo = 'Alíquota GGR não conta a história completa',
  kpi_principal = 'Carga total pode superar 50-60%',
  bullets = ARRAY[
    'GGR tax 2026: 13% (BR) vs UK 21%, França 22%, Itália 24%',
    'Carga total BR: GGR tax + IRPJ/CSLL (34%) + PIS/Cofins (~9,25%) + ISS (~5%)',
    'Carga efetiva sobre o lucro supera maioria dos mercados europeus — dado omitido no debate público'
  ],
  fonte_rodape = 'Fonte: LC 224/2025; H2 Gambling Capital; Receita Federal. Estimativa de carga total.'
WHERE bloco_deck = 'B8.6';
```

---

## TAREFA 4 — ADICIONAR SLIDE DE INADIMPLÊNCIA COM NOTA EXPLÍCITA

Localize o slide B4.5 e atualize com a anotação obrigatória:

```sql
UPDATE slides SET
  bullets = ARRAY[
    '81,7 mi inadimplentes em 2026 — série histórica começa em 2016, ANTES das bets',
    'Crescimento causado por: pandemia (2020-21), crédito fácil com juros baixos, inflação',
    'ATENÇÃO: sem correlação causal identificada com apostas — fenômeno estrutural e anterior'
  ]
WHERE bloco_deck = 'B4.5';
```

---

## TAREFA 5 — CRIAR OS 9 SLIDES DE INSIGHT EDITORIAL

Insira os seguintes slides no banco com `status = 'approved'`. São slides especiais de análise autoral — layout diferente dos slides de dados (sem barra accent esquerda, texto corrido, formato editorial).

```sql
INSERT INTO slides (bloco_deck, titulo, kpi_principal, bullets, fonte_rodape, status, order_index) VALUES

('B1.I', 'Insight Editorial — Marco Regulatório', 'Análise · Fellipe Fraga, CBO',
ARRAY[
  'O arcabouço institucional está construído. O debate regulatório permanece aberto.',
  'Em 2026 o enforcement avançou sobre a fragilidade mais evidente: o mercado ilegal. O Decreto 13.033 e a Portaria 1.766 deslocaram o foco do endereço do site para a infraestrutura econômica que permite ao ilegal operar — alcançando fintechs, IFs e influenciadores.',
  'O desafio que persiste é de discurso: a confusão deliberada entre empresas reguladas e práticas do mercado ilegal repercute em decisões regulatórias que penalizam quem cumpre as regras.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 13),

('B2.I', 'Insight Editorial — Mercado e Arrecadação', 'Análise · Fellipe Fraga, CBO',
ARRAY[
  'O primeiro semestre não descreve um mercado em explosão. Descreve algo possivelmente mais relevante: um mercado regulado que continua crescendo, mesmo enquanto amplia mecanismos de proteção, enforcement e restrição de acesso.',
  'Junho, mês da Copa com 72 partidas, registrou o menor GGR do semestre (R$ 3,34bi). O pico foi janeiro (R$ 4,29bi) — por antecipação dos calendários esportivos, não por efeito Copa. Mais de 5 milhões de brasileiros estão formalmente excluídos das plataformas por políticas regulatórias ativas.',
  'Para uma indústria ainda formando sua série histórica, consistência é uma informação mais útil do que euforia.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 29),

('B3.I', 'Insight Editorial — Enforcement e B2B', 'Análise · Fellipe Fraga, CBO',
ARRAY[
  'O bloqueio de domínios tem alcance limitado: uma operação ilegal pode reaparecer em outro endereço. O Decreto 13.033 mudou o enforcement ao focar na infraestrutura econômica que mantém o ilegal funcionando.',
  'A Operação Conto da Sorte ilustra essa mudança: 37 empresas de um único grupo declararam R$ 400-500 mi e movimentaram R$ 50 bilhões via fintechs. O combate ao mercado clandestino depende de acompanhar o dinheiro — não apenas de retirar páginas do ar.',
  'PIX e KYC formam uma única camada de controle: identidade + rastreabilidade + dados individualizados — a base que tornou o enforcement de 2026 possível.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 37),

('B4.I', 'Insight Editorial — Perfil e Jogo Responsável', 'Análise · Fellipe Fraga, CBO',
ARRAY[
  'Apostar é um ato de lazer. 30,9 mi de CPFs são cadastros acumulados em 18 meses — não apostadores ativos. Os ativos no 1T26 foram 15,2 mi. Misturar estoque cadastral com usuários ativos distorce a leitura do mercado.',
  'A inadimplência brasileira cresceu 38,1% entre 2016 e 2026 por razões estruturais: pandemia, crédito fácil, inflação. A série começa antes da legalização de 2018 e muito antes do mercado regulado de 2025. Correlação não é causalidade.',
  'Políticas públicas melhores começam quando correlação, causalidade e contexto deixam de ser tratados como sinônimos. O dado de 55,64% em multiplataforma reforça a prioridade estratégica certa: retenção supera volume de cadastros.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 49),

('B5.I', 'Insight Editorial — Mídia e Patrocínios', 'Análise · Fellipe Fraga, CBO',
ARRAY[
  'Queda de 50% nos patrocínios master em 2026 sinaliza racionalização — não recuo. As bets continuam sendo a principal categoria do futebol brasileiro, mas o período em que qualquer propriedade encontrava um operador disposto a comprá-la começou a dar lugar a decisões mais seletivas.',
  'A discussão mais produtiva não está entre proibir tudo e permitir tudo, mas em construir critérios de conteúdo, frequência, horário e fiscalização aplicáveis na prática. Restrição sem calibragem é tão problemática quanto permissividade sem limites.',
  'O mercado amadurece quando o debate sobre patrocínio passa a incluir garantias, capacidade de pagamento e qualidade da contraparte — não apenas o valor anunciado.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 57),

('B6.I', 'Insight Editorial — Competição e Consolidação', 'Análise · Fellipe Fraga, CBO',
ARRAY[
  '87 operadoras autorizadas e 67% do GGR concentrado em 10 marcas: existência de licenças não se traduz automaticamente em equilíbrio competitivo. O piso de sustentabilidade estimado é R$ 5 mi/mês — uma referência econômica, não uma linha regulatória.',
  'A conta aberta não é unidade perfeita de participação de mercado. Com 55,64% dos apostadores em 2+ plataformas, a competição relevante ocorre na frequência de uso, na retenção e na confiança — não no cadastro.',
  'Consolidação não significa fracasso da regulação. É parte do ajuste de uma indústria onde licença, escala e rentabilidade precisam coexistir. A lacuna sem FGC equivalente é o risco sistêmico que o crescimento ainda não testou em escala.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 65),

('B7.I', 'Insight Editorial — Perspectivas 2026-2028', 'Análise · Fellipe Fraga, CBO',
ARRAY[
  'O foco se desloca: de criar o mercado para elevar sua efetividade. Em 2025, a prioridade era colocar o mercado em funcionamento. Em 2026-2027, a questão passa a ser reduzir assimetrias entre quem suporta o custo da regulação e quem permanece fora dela.',
  'Entre 2026 e 2028, crescimento e enforcement serão inseparáveis. Um mercado autorizado pode crescer sem ampliar relevância se parte da demanda continuar no ilegal. O indicador mais útil: GGR regulado + arrecadação + proteção ao usuário + redução da vantagem competitiva do clandestino.',
  'A tese de top 5 global até 2030 é plausível, mas continua sendo uma projeção condicionada a crescimento, canalização e estabilidade normativa — não uma garantia.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 71),

('B8.I', 'Insight Editorial — Contexto Global', 'Análise · Fellipe Fraga, CBO — REGISTRO ANALÍTICO-OPINATIVO',
ARRAY[
  'A utilidade da comparação internacional está menos em importar respostas prontas e mais em observar os efeitos colaterais de escolhas regulatórias. Mercados diferem em renda, maturidade e capacidade institucional — não há modelo a copiar.',
  'O UK ensina que proteção precisa ser avaliada junto com canalização e comportamento real do usuário. A regulação brasileira dos prediction markets foi pioneira: estabeleceu fronteiras antes que escala e inovação tornassem o enquadramento ainda mais difícil.',
  'O desafio será crescer sem repetir, em velocidade acelerada, problemas que jurisdições mais antigas levaram anos para reconhecer.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 78),

('B9.I', 'Insight Editorial — Sobre a Stellar Gaming', 'Análise · Fellipe Fraga, CBO',
ARRAY[
  'Quando mais da metade dos apostadores usa 2+ plataformas, abrir uma conta é apenas o início da disputa. Confiança, produto e consistência determinam qual marca permanece na rotina do usuário. A estratégia de crescimento sustentável com foco em LTV e retenção não é conservadorismo — é a leitura correta do mercado.',
  'Compliance não é obstáculo. Proteção ao consumidor não é mensagem genérica. Este relatório é parte desse compromisso: transparência setorial como capital intelectual e como responsabilidade.',
  'Born to Lead não é uma afirmação de liderança concluída. É uma postura diante de um mercado em construção.'
],
'Stellar Gaming · Relatório 2026A · Insight editorial', 'approved', 82);
```

---

## TAREFA 6 — CRIAR GRÁFICOS NO APP

Na página `/graficos` do app (criar se não existir), adicione os seguintes gráficos com Chart.js, usando paleta Stellar (#0D1117 fundo, #C8F000 barras principais, #1DB67A positivo, #eb6834 referência):

**G1 — GGR Mensal 1S/2026**
- Tipo: barras + duas linhas de média
- Dados: Jan 4,29 | Fev 2,80 | Mar 2,80 | Abr ~3,50 | Mai ~3,34 | Jun 3,34 (R$ bi)
- Linha laranja: média 1S/2025 = 2,90
- Linha cinza tracejada: média 1S/2026 = 3,35
- Nota no gráfico: "Junho = Copa do Mundo (19 dias / 72 partidas)"

**G2 — Market Share Top 10 (2025)**
- Tipo: barras horizontais
- Dados: Betano 23% | Bet365 20% | SportingBet 6% | Esp.Sorte 5,5% | Superbet 5% | Blaze 3% | Betnacional 2,8% | EstrelaBet 2% | CassinoPix 2% | 7K 1,5%
- EstrelaBet em destaque com cor diferente (#1DB67A)
- Nota: "Shares além do Top 2 são estimativas (H2GC + LCA/IBJR, 2025)"

**G3 — Destinação Social 1S/2026**
- Tipo: barras horizontais
- Dados (R$ mi): Esporte 870 | Turismo 641 | Segurança 310 | Educação 228 | Seg.Social 228 | Saúde 24
- Total: R$ 2,49 bi (12,4% do GGR)

**G4 — Perfil Etário dos Apostadores**
- Tipo: barras verticais
- Dados: até 24 anos 21,3% | 25-30 anos 22,0% | 31-40 anos 28,95% | 41-50 anos 18% | 51+ 9,77%
- Barra 31-40 anos em #C8F000 (destaque)

**G5 — Escala de Alíquotas + Comparativo Internacional**
- Painel 1 (barras): 2025=12% | 2026=13% | 2027=14% | 2028=15%
- Painel 2 (barras horizontais): Brasil 2026=13% (verde) | Brasil 2028=15% (verde claro) | Espanha=20% | UK=21% | França=22% | Itália=24%
- Nota obrigatória: "Carga tributária total no Brasil (GGR tax + IRPJ/CSLL + PIS/Cofins) pode superar 50-60% sobre o lucro"

**G6 — Inadimplência 2016-2026**
- Tipo: linha
- Dados (mi): 2016=59 | 2017=59,1 | 2018=59,7 | 2019=62,2 | 2020=63,9 | 2021=61,6 | 2022=65,2 | 2023=70,5 | 2024=72 | 2025=75 | 2026=81,7
- Linha vertical em jan/2025: "Início do mercado regulado"
- Caixa de atenção em destaque: "Crescimento anterior ao mercado de apostas — sem correlação causal identificada"

**G7 — Projeção GGR + Tributos 2025-2028**
- Tipo: barras (GGR) + linha (tributos)
- GGR (R$ bi): 2025=37 (realizado) | 2026=40 | 2027=51 | 2028=60 (projeções)
- Tributos (R$ bi, linha laranja): 2025=9,95 | 2026=13 | 2027=15 | 2028=17
- Barras 2026-2028 semi-transparentes (projeção)

---

## TAREFA 7 — EXPORTAR PPTX FINAL

Após aplicar identidade visual, inserir insights e gráficos:

1. Acesse `/exportar` no app
2. Confirme: 81 slides + 9 insights = 90 slides aprovados
3. Exporte o deck em PDF/PPTX com configurações:
   - Autor: Fellipe Fraga
   - Data: 18/08/2026
   - Versão: v1.0
4. Envie print do dashboard mostrando contagem final e confirmação de export

---

## DADOS PARA REFERÊNCIA RÁPIDA

```
GGR 1S/2026: R$ 20,07 bi (+15,3%)
Copa junho: R$ 3,34 bi (MENOR do semestre)
Pico janeiro: R$ 4,29 bi
Turnover: R$ 410,85 bi | RTP: 92,2%
Alíquota: 13% desde 01/04/2026
5 mi bloqueados | 50 mil+ sites derrubados
Apostadores ativos 1T26: 15,2 mi (≠ 30,9 mi cadastros 18 meses)
Market share: Betano 23% | Bet365 20% | EstrelaBet 2%
Inadimplência: sem correlação com bets
Stellar share estimado: ~2% (top 10 entre 187 marcas)
```

**Born to Lead.**
