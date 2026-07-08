
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  input_text text,
  input_type text CHECK (input_type IN ('url','text')),
  classification jsonb,
  sumario_update text,
  slide jsonb,
  texto_rascunho text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
  error_msg text
);

CREATE TABLE public.sumario_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  content text,
  version_label text,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL
);

CREATE TABLE public.slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  bloco_deck text,
  titulo text,
  kpi_principal text,
  bullets text[],
  fonte_rodape text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  order_index integer DEFAULT 0
);

CREATE TABLE public.texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  bloco text,
  content text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved','revision'))
);

CREATE TABLE public.config (
  key text PRIMARY KEY,
  value text
);

INSERT INTO public.config (key, value) VALUES ('anthropic_key',''), ('current_sumario','')
ON CONFLICT (key) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sumario_versions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slides TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.texts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config TO anon, authenticated;
GRANT ALL ON public.sources, public.sumario_versions, public.slides, public.texts, public.config TO service_role;

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sumario_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "single-user open" ON public.sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "single-user open" ON public.sumario_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "single-user open" ON public.slides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "single-user open" ON public.texts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "single-user open" ON public.config FOR ALL USING (true) WITH CHECK (true);
