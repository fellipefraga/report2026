# Stellar Report App 2026

App interno para produção do **Relatório do Setor de Apostas 2026** da Stellar Gaming Group (EstrelaBet / Vupi).

## Stack

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **IA**: Anthropic Claude (claude-sonnet-4-5)
- **Repositório**: GitHub (fellipefraga/report2026)

## Páginas

| Rota | Descrição |
|---|---|
| `/` | Dashboard com stats e checklist de cobertura |
| `/fontes` | Processamento de fontes com IA |
| `/sumario` | Editor do sumário com histórico de versões |
| `/slides` | Grid de slides com aprovação e edição |
| `/textos` | Textos agrupados por bloco |
| `/exportar` | Exportação do deck e relatório |
| `/configuracoes` | Chave Anthropic e zona de risco |

## Setup

```bash
pnpm install
pnpm dev
```

Deploy da Edge Function:
```bash
supabase functions deploy process-source --project-ref oesmqkraatrziynddlqz
```

Configure a chave Anthropic em `/configuracoes`.

---
**Stellar Gaming Group** · EstrelaBet · Vupi · 2026
