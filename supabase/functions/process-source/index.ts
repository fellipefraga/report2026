import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Você é o processador de inteligência editorial do Relatório Stellar Gaming 2026, sobre o mercado brasileiro de apostas esportivas regulamentadas. Blocos do relatório: Bloco 1 (Marco Regulatório), Bloco 2 (Mercado/GGR), Bloco 3 (Pagamentos/Enforcement), Bloco 4 (Usuários/Jogo Responsável), Bloco 5 (Mídia/Patrocínios), Bloco 6 (Competição/Consolidação), Bloco 7 (Perspectivas 2026-2028), Bloco 8 (Contexto Global), Bloco 9 (Stellar Gaming). Empresa: Stellar Gaming, marcas Estrelabet e Vupi. Dados 2026=ATUAL, anteriores=REF. Retorne SOMENTE JSON válido.`

const USER_PROMPT_TEMPLATE = (inputText: string, mode: string) => {
  const modeInstructions: Record<string, string> = {
    completo: 'Gere todos os 4 campos: classification, sumario_update, slide e texto_rascunho.',
    sumario: 'Gere apenas o campo classification e sumario_update. Para slide e texto_rascunho, retorne null.',
    slide: 'Gere apenas o campo classification e slide. Para sumario_update e texto_rascunho, retorne null.',
    texto: 'Gere apenas o campo classification e texto_rascunho. Para sumario_update e slide, retorne null.',
  }

  return `Analise a seguinte fonte de pesquisa e ${modeInstructions[mode] || modeInstructions.completo}

FONTE:
${inputText}

Retorne SOMENTE este JSON válido (sem markdown, sem explicações):
{
  "classification": {
    "data": "mês/ano",
    "tipo": "ATUAL|REF|INTERNO",
    "fonte": "nome da fonte",
    "blocos": ["Bloco X (Nome)"],
    "resumo": "2-3 frases descrevendo o conteúdo"
  },
  "sumario_update": "texto formatado para o sumário ou null",
  "slide": {
    "bloco_deck": "D2.X",
    "titulo": "headline até 8 palavras",
    "kpi_principal": "dado principal em destaque",
    "bullets": ["bullet 1", "bullet 2", "bullet 3"],
    "fonte_rodape": "Fonte: nome, mês/ano"
  } ou null,
  "texto_rascunho": "parágrafo de 80-150 palavras em português ou null"
}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    // Test mode - just verify the API key works
    if (body.test) {
      const { data: configData } = await supabaseClient
        .from('config')
        .select('value')
        .eq('key', 'anthropic_key')
        .single()

      const apiKey = configData?.value
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Chave Anthropic não configurada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Test the API key with a minimal request
      const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "ok"' }],
        }),
      })

      if (!testResponse.ok) {
        const errText = await testResponse.text()
        return new Response(
          JSON.stringify({ error: `API key inválida: ${errText}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { source_id, input_text, mode = 'completo' } = body

    if (!source_id || !input_text) {
      return new Response(
        JSON.stringify({ error: 'source_id e input_text são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Anthropic API key from config
    const { data: configData, error: configError } = await supabaseClient
      .from('config')
      .select('value')
      .eq('key', 'anthropic_key')
      .single()

    if (configError || !configData?.value) {
      await supabaseClient
        .from('sources')
        .update({ status: 'error', error_msg: 'Chave Anthropic não configurada. Acesse Configurações.' })
        .eq('id', source_id)

      return new Response(
        JSON.stringify({ error: 'Chave Anthropic não configurada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropicKey = configData.value

    // Call Anthropic Claude API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: USER_PROMPT_TEMPLATE(input_text, mode),
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text()
      await supabaseClient
        .from('sources')
        .update({ status: 'error', error_msg: `Erro na API Anthropic: ${errText}` })
        .eq('id', source_id)

      return new Response(
        JSON.stringify({ error: `Erro na API Anthropic: ${errText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropicData = await anthropicResponse.json()
    const rawContent = anthropicData.content?.[0]?.text || ''

    // Parse JSON response
    let parsed: {
      classification?: Record<string, unknown>
      sumario_update?: string | null
      slide?: Record<string, unknown> | null
      texto_rascunho?: string | null
    }
    try {
      // Remove potential markdown code blocks
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      await supabaseClient
        .from('sources')
        .update({ status: 'error', error_msg: `Resposta inválida da IA: ${rawContent.slice(0, 200)}` })
        .eq('id', source_id)

      return new Response(
        JSON.stringify({ error: 'Resposta inválida da IA', raw: rawContent }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update source with results
    await supabaseClient
      .from('sources')
      .update({
        classification: parsed.classification || null,
        sumario_update: parsed.sumario_update || null,
        slide: parsed.slide || null,
        texto_rascunho: parsed.texto_rascunho || null,
        status: 'done',
      })
      .eq('id', source_id)

    // Save slide if generated
    if (parsed.slide) {
      const slide = parsed.slide as {
        bloco_deck?: string
        titulo?: string
        kpi_principal?: string
        bullets?: string[]
        fonte_rodape?: string
      }
      await supabaseClient.from('slides').insert({
        source_id,
        bloco_deck: slide.bloco_deck || '',
        titulo: slide.titulo || '',
        kpi_principal: slide.kpi_principal || '',
        bullets: slide.bullets || [],
        fonte_rodape: slide.fonte_rodape || '',
        status: 'draft',
        order_index: 0,
      })
    }

    // Save text if generated
    if (parsed.texto_rascunho) {
      const classification = parsed.classification as { blocos?: string[] } | undefined
      const bloco = classification?.blocos?.[0] || 'Bloco 1 (Marco Regulatório)'
      await supabaseClient.from('texts').insert({
        source_id,
        bloco,
        content: parsed.texto_rascunho,
        status: 'draft',
      })
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
