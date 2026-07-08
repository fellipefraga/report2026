# Stellar Report App 2026

App interno para Fellipe Fraga (CBO da Stellar Gaming) produzir o **Relatório do Setor de Apostas 2026**. O app processa fontes de pesquisa (URLs e textos) via Claude API e gera automaticamente: classificação editorial, update de sumário, slide para deck e rascunho de texto.

## Repositórios

| Repositório | Finalidade |
|---|---|
| `fellipefraga/report2026` | Repositório de referência com schema SQL, Edge Function e documentação |
| `fellipefraga/stellar-report-hub` | Repositório gerenciado pelo Lovable (código do app React) |

## App em produção

O app está hospedado no Lovable:

**Preview:** https://id-preview--9d7ab6f8-b8a7-4394-a3dd-fadb4cf14818.lovable.app

**Editor Lovable:** https://lovable.dev/projects/9d7ab6f8-b8a7-4394-a3dd-fadb4cf14818

## Infraestrutura

| Serviço | URL |
|---|---|
| Supabase | https://supabase.com/dashboard/project/oesmqkraatrziynddlqz |
| GitHub (app) | https://github.com/fellipefraga/stellar-report-hub |
| GitHub (docs) | https://github.com/fellipefraga/report2026 |

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS (via Lovable / TanStack Start)
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **IA:** Anthropic Claude Sonnet 4.5
- **Identidade visual:** Stellar Gaming (#0D1117 background, #C8F000 accent lime)

## Páginas do App

| Página | Rota | Descrição |
|---|---|---|
| Dashboard | `/` | Visão geral, 4 cards de métricas, cobertura dos 9 blocos |
| Fontes | `/fontes` | Processamento de URLs/textos com IA (página principal) |
| Sumário | `/sumario` | Editor do sumário com histórico de versões |
| Slides | `/slides` | Grid de cards de slides com aprovação e exportação |
| Textos | `/textos` | Textos agrupados por bloco com edição inline |
| Exportar | `/exportar` | Exportação do deck (PDF) e relatório (Word) |
| Configurações | `/configuracoes` | Chave Anthropic, sumário atual, zona de risco |

## Banco de Dados (Supabase)

As tabelas estão criadas no projeto Supabase `oesmqkraatrziynddlqz`. O schema completo está em:

```
supabase/migrations/20260708152124_1f7a1f34-2b3e-4f35-a5ab-9671738cd7c8.sql
```

### Tabelas

| Tabela | Descrição |
|---|---|
| `sources` | Fontes processadas com outputs da IA |
| `slides` | Slides gerados para o deck |
| `texts` | Textos rascunhados por bloco |
| `sumario_versions` | Histórico de versões do sumário |
| `config` | Configurações (chave Anthropic, sumário atual) |

## Edge Function

A Edge Function `process-source` está deployada no Supabase e é responsável por:

1. Receber `{ source_id, input_text, mode }` do frontend
2. Buscar a chave Anthropic na tabela `config`
3. Chamar a API da Anthropic (Claude Sonnet 4.5)
4. Salvar os resultados nas tabelas `sources`, `slides` e `texts`

O código está em: `supabase/functions/process-source/index.ts`

## Configuração inicial

Após o deploy, acesse **Configurações** no app e insira sua chave Anthropic (`sk-ant-...`).

## Blocos do Relatório

| Bloco | Tema |
|---|---|
| Bloco 1 | Marco Regulatório |
| Bloco 2 | Mercado, Arrecadação e GGR |
| Bloco 3 | Pagamentos e Enforcement |
| Bloco 4 | Perfil do Usuário e Jogo Responsável |
| Bloco 5 | Mídia e Patrocínios |
| Bloco 6 | Competição e Consolidação |
| Bloco 7 | Perspectivas 2026-2028 |
| Bloco 8 | Contexto Global |
| Bloco 9 | Sobre a Stellar Gaming |

---

*Stellar Gaming Group · EstrelaBet · Vupi · Born to Lead · 2026*
