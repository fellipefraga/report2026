import { useEffect, useState } from 'react'
import { Copy, ChevronDown, ChevronUp, Plus, Zap, BookOpen, Presentation, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, type Source } from '../lib/supabase'
import {
  Card, Button, Badge, StatusBadge, PageHeader, EmptyState,
  Spinner, Textarea, Input, formatDateTime
} from '../components/ui'

type Mode = 'completo' | 'sumario' | 'slide' | 'texto'
type Tab = 'url' | 'text'

const LOADING_MESSAGES = [
  'Analisando fonte…',
  'Classificando conteúdo…',
  'Mapeando blocos do relatório…',
  'Gerando outputs com IA…',
]

export default function Fontes() {
  const [tab, setTab] = useState<Tab>('url')
  const [mode, setMode] = useState<Mode>('completo')
  const [inputValue, setInputValue] = useState('')
  const [processing, setProcessing] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [result, setResult] = useState<Source | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [loadingSources, setLoadingSources] = useState(true)

  useEffect(() => {
    loadSources()
  }, [])

  // Rotate loading messages
  useEffect(() => {
    if (!processing) return
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [processing])

  // Cmd+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (inputValue.trim()) handleProcess()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [inputValue])

  async function loadSources() {
    setLoadingSources(true)
    const { data } = await supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false })
    setSources(data || [])
    setLoadingSources(false)
  }

  async function handleProcess() {
    if (!inputValue.trim()) {
      toast.error('Insira uma URL ou texto para processar')
      return
    }

    setProcessing(true)
    setLoadingMsg(0)
    setResult(null)

    try {
      // Create source record
      const { data: source, error: insertError } = await supabase
        .from('sources')
        .insert({
          input_text: inputValue.trim(),
          input_type: tab,
          status: 'processing',
        })
        .select()
        .single()

      if (insertError || !source) {
        throw new Error(insertError?.message || 'Erro ao criar fonte')
      }

      // Call Edge Function
      const { error: fnError } = await supabase.functions.invoke('process-source', {
        body: {
          source_id: source.id,
          input_text: inputValue.trim(),
          mode,
        },
      })

      if (fnError) {
        // Update source with error
        await supabase
          .from('sources')
          .update({ status: 'error', error_msg: fnError.message })
          .eq('id', source.id)
        throw new Error(fnError.message)
      }

      // Reload source with results
      const { data: updatedSource } = await supabase
        .from('sources')
        .select('*')
        .eq('id', source.id)
        .single()

      setResult(updatedSource)
      toast.success('Fonte processada com sucesso!')
      loadSources()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar fonte'
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleSaveSlide(source: Source) {
    if (!source.slide) return
    const { error } = await supabase.from('slides').insert({
      source_id: source.id,
      ...source.slide,
      status: 'draft',
      order_index: 0,
    })
    if (error) {
      toast.error('Erro ao salvar slide')
    } else {
      toast.success('Slide salvo!')
    }
  }

  async function handleSaveText(source: Source) {
    if (!source.texto_rascunho) return
    const bloco = source.classification?.blocos?.[0] || 'Bloco 1 (Marco Regulatório)'
    const { error } = await supabase.from('texts').insert({
      source_id: source.id,
      bloco,
      content: source.texto_rascunho,
      status: 'draft',
    })
    if (error) {
      toast.error('Erro ao salvar texto')
    } else {
      toast.success('Texto salvo!')
    }
  }

  async function handleApplySumario(source: Source) {
    if (!source.sumario_update) return
    const { data: config } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'current_sumario')
      .single()

    const currentSumario = config?.value || ''
    const newSumario = currentSumario
      ? `${currentSumario}\n\n${source.sumario_update}`
      : source.sumario_update

    const { error } = await supabase
      .from('config')
      .update({ value: newSumario })
      .eq('key', 'current_sumario')

    if (error) {
      toast.error('Erro ao aplicar ao sumário')
    } else {
      // Save version
      await supabase.from('sumario_versions').insert({
        content: newSumario,
        version_label: `Atualizado em ${new Date().toLocaleDateString('pt-BR')}`,
        source_id: source.id,
      })
      toast.success('Sumário atualizado!')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const modeOptions: { value: Mode; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { value: 'completo', label: 'Completo (4 saídas)', icon: Zap },
    { value: 'sumario', label: 'Só sumário', icon: BookOpen },
    { value: 'slide', label: 'Só slide', icon: Presentation },
    { value: 'texto', label: 'Só texto', icon: FileText },
  ]

  return (
    <div className="p-6">
      <PageHeader
        title="Fontes"
        description="Processe URLs e textos com IA para gerar conteúdo editorial"
      />

      {/* Input form */}
      <Card className="mb-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ backgroundColor: '#0D1117' }}>
          {(['url', 'text'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all"
              style={
                tab === t
                  ? { backgroundColor: '#1A1A16', color: '#FFFFFF', border: '1px solid #2A2A26' }
                  : { color: '#A0A09A' }
              }
            >
              {t === 'url' ? 'URL' : 'Texto livre'}
            </button>
          ))}
        </div>

        {/* Input */}
        {tab === 'url' ? (
          <Input
            value={inputValue}
            onChange={setInputValue}
            placeholder="https://exemplo.com/artigo"
          />
        ) : (
          <Textarea
            value={inputValue}
            onChange={setInputValue}
            placeholder="Cole aqui o texto da fonte de pesquisa…"
            rows={6}
          />
        )}

        {/* Mode selector */}
        <div className="mt-4">
          <div className="text-xs font-medium mb-2" style={{ color: '#A0A09A' }}>
            Modo de processamento
          </div>
          <div className="grid grid-cols-4 gap-2">
            {modeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all"
                style={
                  mode === value
                    ? { backgroundColor: 'rgba(200, 240, 0, 0.1)', borderColor: '#C8F000', color: '#C8F000' }
                    : { backgroundColor: '#0D1117', borderColor: '#2A2A26', color: '#A0A09A' }
                }
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleProcess}
          loading={processing}
          disabled={!inputValue.trim()}
          fullWidth
          size="lg"
          className="mt-4"
        >
          {processing ? LOADING_MESSAGES[loadingMsg] : 'Processar com IA'}
        </Button>
        <p className="text-xs text-center mt-2" style={{ color: '#A0A09A' }}>
          Cmd+Enter para processar
        </p>
      </Card>

      {/* Results */}
      {result && result.status === 'done' && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">Resultados</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Classification */}
            {result.classification && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold" style={{ color: '#A0A09A' }}>
                    CLASSIFICAÇÃO
                  </div>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(result.classification, null, 2))}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{result.classification.tipo}</Badge>
                    <span className="text-xs" style={{ color: '#A0A09A' }}>
                      {result.classification.data}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-white">{result.classification.fonte}</div>
                  <div className="flex flex-wrap gap-1">
                    {result.classification.blocos.map((b) => (
                      <Badge key={b} variant="muted">
                        {b}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: '#A0A09A' }}>
                    {result.classification.resumo}
                  </p>
                </div>
              </Card>
            )}

            {/* Sumario update */}
            {result.sumario_update && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold" style={{ color: '#A0A09A' }}>
                    UPDATE DE SUMÁRIO
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(result.sumario_update!)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-white whitespace-pre-wrap">{result.sumario_update}</p>
                <Button
                  onClick={() => handleApplySumario(result)}
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                >
                  Aplicar ao sumário
                </Button>
              </Card>
            )}

            {/* Slide preview */}
            {result.slide && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold" style={{ color: '#A0A09A' }}>
                    SLIDE PREVIEW
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result.slide, null, 2))}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                {/* Slide card preview */}
                <div className="rounded-lg p-3 border" style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}>
                  <Badge variant="accent" className="mb-2">
                    {result.slide.bloco_deck}
                  </Badge>
                  <div className="text-sm font-semibold text-white mb-1">{result.slide.titulo}</div>
                  <div className="text-xl font-bold mb-2" style={{ color: '#C8F000' }}>
                    {result.slide.kpi_principal}
                  </div>
                  <ul className="space-y-1">
                    {result.slide.bullets.map((b, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: '#A0A09A' }}>
                        <span style={{ color: '#C8F000' }}>·</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs mt-2" style={{ color: '#A0A09A' }}>
                    {result.slide.fonte_rodape}
                  </div>
                </div>
                <Button
                  onClick={() => handleSaveSlide(result)}
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                >
                  Salvar slide
                </Button>
              </Card>
            )}

            {/* Texto rascunho */}
            {result.texto_rascunho && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold" style={{ color: '#A0A09A' }}>
                    RASCUNHO DE TEXTO
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.texto_rascunho!)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="text-sm text-white leading-relaxed">{result.texto_rascunho}</p>
                <Button
                  onClick={() => handleSaveText(result)}
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                >
                  Salvar texto
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {result && result.status === 'error' && (
        <Card className="mb-6 border-red-500/30">
          <div className="text-sm text-red-400">
            Erro ao processar: {result.error_msg || 'Erro desconhecido'}
          </div>
        </Card>
      )}

      {/* History table */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Histórico de Fontes</h2>
        <Card>
          {loadingSources ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : sources.length === 0 ? (
            <EmptyState
              icon={<FileText size={32} />}
              title="Nenhuma fonte processada"
              description="Adicione sua primeira fonte de pesquisa acima."
              action={
                <Button onClick={() => setInputValue('')} size="sm">
                  <Plus size={14} />
                  Adicionar fonte
                </Button>
              }
            />
          ) : (
            <div>
              {/* Header */}
              <div
                className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium border-b"
                style={{ color: '#A0A09A', borderColor: '#2A2A26' }}
              >
                <div className="col-span-5">Fonte</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-2">Blocos</div>
                <div className="col-span-2">Data</div>
                <div className="col-span-1">Status</div>
              </div>

              {sources.map((source) => (
                <div key={source.id}>
                  <div
                    className="grid grid-cols-12 gap-3 px-3 py-3 border-b cursor-pointer hover:bg-white/3 transition-colors"
                    style={{ borderColor: '#2A2A26' }}
                    onClick={() => toggleRow(source.id)}
                  >
                    <div className="col-span-5 flex items-center gap-2">
                      <span className="text-sm text-white truncate">
                        {source.input_type === 'url'
                          ? source.input_text
                          : source.input_text.slice(0, 60) + '…'}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <Badge variant="muted">{source.input_type === 'url' ? 'URL' : 'Texto'}</Badge>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-xs" style={{ color: '#A0A09A' }}>
                        {source.classification?.blocos?.[0] || '—'}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-xs" style={{ color: '#A0A09A' }}>
                        {formatDateTime(source.created_at)}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-between">
                      <StatusBadge status={source.status} />
                      {expandedRows.has(source.id) ? (
                        <ChevronUp size={14} style={{ color: '#A0A09A' }} />
                      ) : (
                        <ChevronDown size={14} style={{ color: '#A0A09A' }} />
                      )}
                    </div>
                  </div>

                  {/* Expanded row */}
                  {expandedRows.has(source.id) && (
                    <div className="px-3 py-4 border-b" style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}>
                      <div className="grid grid-cols-2 gap-4">
                        {source.classification && (
                          <div>
                            <div className="text-xs font-medium mb-2" style={{ color: '#A0A09A' }}>
                              Classificação
                            </div>
                            <p className="text-sm text-white">{source.classification.resumo}</p>
                          </div>
                        )}
                        {source.texto_rascunho && (
                          <div>
                            <div className="text-xs font-medium mb-2" style={{ color: '#A0A09A' }}>
                              Rascunho
                            </div>
                            <p className="text-sm text-white line-clamp-3">{source.texto_rascunho}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
