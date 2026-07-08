import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oesmqkraatrziynddlqz.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc21xa3JhYXRyeml5bmRkbHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTM5MjcsImV4cCI6MjA5OTA4OTkyN30.5-ecdVAZZc8jMkuND84IC6-lPNQcCXAvZHjHM8NHNiI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Source {
  id: string
  created_at: string
  input_text: string
  input_type: 'url' | 'text'
  classification: Classification | null
  sumario_update: string | null
  slide: SlideData | null
  texto_rascunho: string | null
  status: 'pending' | 'processing' | 'done' | 'error'
  error_msg: string | null
}

export interface Classification {
  data: string
  tipo: 'ATUAL' | 'REF' | 'INTERNO'
  fonte: string
  blocos: string[]
  resumo: string
}

export interface SlideData {
  bloco_deck: string
  titulo: string
  kpi_principal: string
  bullets: string[]
  fonte_rodape: string
}

export interface Slide {
  id: string
  created_at: string
  source_id: string | null
  bloco_deck: string
  titulo: string
  kpi_principal: string
  bullets: string[]
  fonte_rodape: string
  status: 'draft' | 'approved'
  order_index: number
}

export interface Text {
  id: string
  created_at: string
  source_id: string | null
  bloco: string
  content: string
  status: 'draft' | 'approved' | 'revision'
}

export interface SumarioVersion {
  id: string
  created_at: string
  content: string
  version_label: string
  source_id: string | null
}

export interface Config {
  key: string
  value: string
}
