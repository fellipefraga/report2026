-- ============================================================
-- Stellar Report 2026 — Initial Schema
-- ============================================================

-- sources: fontes de pesquisa processadas pela IA
CREATE TABLE IF NOT EXISTS public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  input_text text NOT NULL,
  input_type text NOT NULL CHECK (input_type IN ('url', 'text')),
  classification jsonb,
  sumario_update text,
  slide jsonb,
  texto_rascunho text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_msg text
);

-- sumario_versions: histórico de versões do sumário
CREATE TABLE IF NOT EXISTS public.sumario_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  content text NOT NULL,
  version_label text NOT NULL,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL
);

-- slides: slides gerados para o deck
CREATE TABLE IF NOT EXISTS public.slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  bloco_deck text NOT NULL,
  titulo text NOT NULL,
  kpi_principal text NOT NULL,
  bullets text[] NOT NULL DEFAULT '{}',
  fonte_rodape text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  order_index int NOT NULL DEFAULT 0
);

-- texts: textos do relatório
CREATE TABLE IF NOT EXISTS public.texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  bloco text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'revision'))
);

-- config: configurações do app
CREATE TABLE IF NOT EXISTS public.config (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

-- Inserir configurações iniciais
INSERT INTO public.config (key, value) VALUES
  ('anthropic_key', ''),
  ('current_sumario', '')
ON CONFLICT (key) DO NOTHING;

-- Desabilitar RLS para uso interno (app sem autenticação)
ALTER TABLE public.sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sumario_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.texts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.config DISABLE ROW LEVEL SECURITY;
