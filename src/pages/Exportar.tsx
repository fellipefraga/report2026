import { useEffect, useState } from 'react'
import { Download, Presentation, AlignLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, type Slide, type Text } from '../lib/supabase'
import { Card, Button, PageHeader, Spinner } from '../components/ui'

export default function Exportar() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [texts, setTexts] = useState<Text[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [slidesResult, textsResult] = await Promise.all([
      supabase.from('slides').select('*').eq('status', 'approved').order('order_index'),
      supabase.from('texts').select('*').eq('status', 'approved').order('bloco'),
    ])
    setSlides(slidesResult.data || [])
    setTexts(textsResult.data || [])
    setLoading(false)
  }

  function exportDeck() {
    if (slides.length === 0) {
      toast.error('Nenhum slide aprovado para exportar')
      return
    }

    const content = slides
      .map(
        (s, i) =>
          `=== SLIDE ${i + 1} ===\n[${s.bloco_deck}]\n\n${s.titulo}\n\nKPI: ${s.kpi_principal}\n\n${s.bullets.map((b) => `• ${b}`).join('\n')}\n\n${s.fonte_rodape}`
      )
      .join('\n\n' + '─'.repeat(40) + '\n\n')

    const header = `STELLAR GAMING — DECK 2026\nGerado em ${new Date().toLocaleDateString('pt-BR')}\n${slides.length} slides aprovados\n\n${'═'.repeat(40)}\n\n`

    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stellar-deck-2026-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${slides.length} slides exportados!`)
  }

  function exportRelatorio() {
    if (texts.length === 0) {
      toast.error('Nenhum texto aprovado para exportar')
      return
    }

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

    const grouped = BLOCOS.map((bloco) => ({
      bloco,
      texts: texts.filter((t) => t.bloco === bloco),
    })).filter((g) => g.texts.length > 0)

    const content = grouped
      .map(
        ({ bloco, texts: blocoTexts }) =>
          `${bloco.toUpperCase()}\n${'─'.repeat(bloco.length)}\n\n${blocoTexts.map((t) => t.content).join('\n\n')}`
      )
      .join('\n\n' + '═'.repeat(40) + '\n\n')

    const header = `RELATÓRIO STELLAR GAMING 2026\nMercado Brasileiro de Apostas Esportivas Regulamentadas\nGerado em ${new Date().toLocaleDateString('pt-BR')}\n${texts.length} textos aprovados\n\n${'═'.repeat(40)}\n\n`

    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stellar-relatorio-2026-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${texts.length} textos exportados!`)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Exportar"
        description="Exporte o deck de slides e o relatório completo"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Deck */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(200, 240, 0, 0.1)' }}
              >
                <Presentation size={20} style={{ color: '#C8F000' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Deck de Slides</h2>
                <p className="text-xs" style={{ color: '#A0A09A' }}>
                  {slides.length} slides aprovados
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {slides.length === 0 ? (
                <p className="text-xs" style={{ color: '#A0A09A' }}>
                  Nenhum slide aprovado. Aprove slides na página Slides para exportar.
                </p>
              ) : (
                slides.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 py-1.5 border-b"
                    style={{ borderColor: '#2A2A26' }}
                  >
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: '#C8F000', color: '#0D1117' }}
                    >
                      {s.bloco_deck}
                    </span>
                    <span className="text-xs text-white truncate">{s.titulo}</span>
                  </div>
                ))
              )}
              {slides.length > 5 && (
                <p className="text-xs" style={{ color: '#A0A09A' }}>
                  + {slides.length - 5} slides adicionais
                </p>
              )}
            </div>

            <Button
              onClick={exportDeck}
              disabled={slides.length === 0}
              fullWidth
            >
              <Download size={14} />
              Exportar Deck (.txt)
            </Button>
          </Card>

          {/* Relatório */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(200, 240, 0, 0.1)' }}
              >
                <AlignLeft size={20} style={{ color: '#C8F000' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Relatório Completo</h2>
                <p className="text-xs" style={{ color: '#A0A09A' }}>
                  {texts.length} textos aprovados
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {texts.length === 0 ? (
                <p className="text-xs" style={{ color: '#A0A09A' }}>
                  Nenhum texto aprovado. Aprove textos na página Textos para exportar.
                </p>
              ) : (
                [...new Set(texts.map((t) => t.bloco))].slice(0, 5).map((bloco) => {
                  const count = texts.filter((t) => t.bloco === bloco).length
                  return (
                    <div
                      key={bloco}
                      className="flex items-center justify-between py-1.5 border-b"
                      style={{ borderColor: '#2A2A26' }}
                    >
                      <span className="text-xs text-white">{bloco}</span>
                      <span className="text-xs" style={{ color: '#A0A09A' }}>
                        {count} texto{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            <Button
              onClick={exportRelatorio}
              disabled={texts.length === 0}
              fullWidth
            >
              <Download size={14} />
              Exportar Relatório (.txt)
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
