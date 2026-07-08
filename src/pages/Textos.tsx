import { useEffect, useState, useRef } from 'react'
import { Copy, ChevronDown, ChevronUp, AlignLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, type Text } from '../lib/supabase'
import { Card, Button, PageHeader, EmptyState, Spinner } from '../components/ui'

const BLOCOS = [
  'Bloco 1 (Marco Regulatório)',
  'Bloco 2 (Mercado/GGR)',
  'Bloco 3 (Pagamentos/Enforcement)',
  'Bloco 4 (Usuários/Jogo Responsável)',
  'Bloco 5 (Mídia/Patrocínios)',
  'Bloco 6 (Competição/Consolidação)',
  'Bloco 7 (Perspectivas 2026-2028)',
  'Bloco 8 (Contexto Global)',
  'Bloco 9 (Stellar Gaming)',
]

type Status = 'draft' | 'approved' | 'revision'

interface TextItemProps {
  text: Text
  onUpdate: () => void
}

function TextItem({ text, onUpdate }: TextItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState(text.content)
  const [status, setStatus] = useState<Status>(text.status as Status)
  const [saving, setSaving] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleContentChange(value: string) {
    setContent(value)
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      handleSave(value, status)
    }, 2000)
  }

  async function handleSave(c = content, s = status) {
    setSaving(true)
    const { error } = await supabase
      .from('texts')
      .update({ content: c, status: s })
      .eq('id', text.id)

    if (error) {
      toast.error('Erro ao salvar')
    } else {
      toast.success('Texto salvo!')
      onUpdate()
    }
    setSaving(false)
  }

  async function handleStatusChange(newStatus: Status) {
    setStatus(newStatus)
    await handleSave(content, newStatus)
  }

  const statusColors: Record<Status, string> = {
    draft: '#A0A09A',
    approved: '#C8F000',
    revision: '#facc15',
  }

  const statusLabels: Record<Status, string> = {
    draft: 'Rascunho',
    approved: 'Aprovado',
    revision: 'Revisão',
  }

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: '#2A2A26' }}>
      <div
        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColors[status] }}
          />
          <span className="text-sm text-white truncate">
            {content.slice(0, 80)}…
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <span className="text-xs" style={{ color: statusColors[status] }}>
            {statusLabels[status]}
          </span>
          {expanded ? (
            <ChevronUp size={14} style={{ color: '#A0A09A' }} />
          ) : (
            <ChevronDown size={14} style={{ color: '#A0A09A' }} />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4" style={{ backgroundColor: '#0D1117' }}>
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg text-sm text-white border outline-none focus:border-[#C8F000] transition-colors resize-none mt-2"
            style={{ backgroundColor: '#1A1A16', borderColor: '#2A2A26' }}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#A0A09A' }}>Status:</span>
              {(['draft', 'revision', 'approved'] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="px-2.5 py-1 rounded text-xs border transition-all"
                  style={
                    status === s
                      ? { backgroundColor: statusColors[s], color: s === 'approved' ? '#0D1117' : '#0D1117', borderColor: statusColors[s] }
                      : { backgroundColor: 'transparent', color: '#A0A09A', borderColor: '#2A2A26' }
                  }
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(content)
                  toast.success('Copiado!')
                }}
                variant="ghost"
                size="sm"
              >
                <Copy size={13} />
                Copiar
              </Button>
              <Button
                onClick={() => handleSave()}
                loading={saving}
                size="sm"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Textos() {
  const [texts, setTexts] = useState<Text[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedBlocos, setExpandedBlocos] = useState<Set<string>>(new Set(BLOCOS))

  useEffect(() => {
    loadTexts()
  }, [])

  async function loadTexts() {
    setLoading(true)
    const { data } = await supabase
      .from('texts')
      .select('*')
      .order('created_at', { ascending: false })
    setTexts(data || [])
    setLoading(false)
  }

  function toggleBloco(bloco: string) {
    setExpandedBlocos((prev) => {
      const next = new Set(prev)
      if (next.has(bloco)) next.delete(bloco)
      else next.add(bloco)
      return next
    })
  }

  const textsByBloco = BLOCOS.map((bloco) => ({
    bloco,
    texts: texts.filter((t) => t.bloco === bloco),
  }))

  const totalApproved = texts.filter((t) => t.status === 'approved').length

  return (
    <div className="p-6">
      <PageHeader
        title="Textos"
        description={`${texts.length} textos · ${totalApproved} aprovados`}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : texts.length === 0 ? (
        <EmptyState
          icon={<AlignLeft size={32} />}
          title="Nenhum texto gerado"
          description="Processe fontes na página Fontes para gerar rascunhos de texto automaticamente."
        />
      ) : (
        <div className="space-y-3">
          {textsByBloco.map(({ bloco, texts: blocoTexts }) => (
            <Card key={bloco} className="p-0 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/3 transition-colors"
                onClick={() => toggleBloco(bloco)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{bloco}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: '#2A2A26', color: '#A0A09A' }}
                  >
                    {blocoTexts.length}
                  </span>
                  {blocoTexts.filter((t) => t.status === 'approved').length > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(200, 240, 0, 0.1)', color: '#C8F000' }}
                    >
                      {blocoTexts.filter((t) => t.status === 'approved').length} aprovados
                    </span>
                  )}
                </div>
                {expandedBlocos.has(bloco) ? (
                  <ChevronUp size={14} style={{ color: '#A0A09A' }} />
                ) : (
                  <ChevronDown size={14} style={{ color: '#A0A09A' }} />
                )}
              </div>

              {expandedBlocos.has(bloco) && (
                <div style={{ borderTop: '1px solid #2A2A26' }}>
                  {blocoTexts.length === 0 ? (
                    <div className="px-4 py-3 text-xs" style={{ color: '#A0A09A' }}>
                      Nenhum texto para este bloco ainda.
                    </div>
                  ) : (
                    blocoTexts.map((text) => (
                      <TextItem key={text.id} text={text} onUpdate={loadTexts} />
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
