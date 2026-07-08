import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Presentation, CheckCircle, Clock, Plus, Circle, CheckCircle2 } from 'lucide-react'
import { supabase, type Source } from '../lib/supabase'
import { Card, Button, StatusBadge, PageHeader, Spinner, formatDateTime } from '../components/ui'

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

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFontes: 0,
    slidesCriados: 0,
    textosAprovados: 0,
    ultimaAtualizacao: '',
  })
  const [recentSources, setRecentSources] = useState<Source[]>([])
  const [blocosComFonte, setBlocosComFonte] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Total fontes
      const { count: totalFontes } = await supabase
        .from('sources')
        .select('*', { count: 'exact', head: true })

      // Slides criados
      const { count: slidesCriados } = await supabase
        .from('slides')
        .select('*', { count: 'exact', head: true })

      // Textos aprovados
      const { count: textosAprovados } = await supabase
        .from('texts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      // Fontes recentes
      const { data: sources } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)

      // Última atualização
      const { data: lastSource } = await supabase
        .from('sources')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)

      // Blocos com fonte
      const { data: allSources } = await supabase
        .from('sources')
        .select('classification')
        .eq('status', 'done')

      const covered = new Set<string>()
      allSources?.forEach((s) => {
        if (s.classification?.blocos) {
          s.classification.blocos.forEach((b: string) => covered.add(b))
        }
      })

      setStats({
        totalFontes: totalFontes || 0,
        slidesCriados: slidesCriados || 0,
        textosAprovados: textosAprovados || 0,
        ultimaAtualizacao: lastSource?.[0]?.created_at
          ? formatDateTime(lastSource[0].created_at)
          : 'Nenhuma ainda',
      })
      setRecentSources(sources || [])
      setBlocosComFonte(covered)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Fontes', value: stats.totalFontes, icon: FileText, color: '#C8F000' },
    { label: 'Slides Criados', value: stats.slidesCriados, icon: Presentation, color: '#C8F000' },
    { label: 'Textos Aprovados', value: stats.textosAprovados, icon: CheckCircle, color: '#C8F000' },
    { label: 'Última Atualização', value: stats.ultimaAtualizacao, icon: Clock, color: '#A0A09A', small: true },
  ]

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do Relatório Stellar Gaming 2026"
        action={
          <Button onClick={() => navigate('/fontes')} size="md">
            <Plus size={16} />
            Nova fonte
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {statCards.map(({ label, value, icon: Icon, color, small }) => (
              <Card key={label}>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs font-medium" style={{ color: '#A0A09A' }}>
                    {label}
                  </div>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className={`font-bold text-white ${small ? 'text-sm' : 'text-2xl'}`}>
                  {value}
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Recent sources */}
            <div className="col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Fontes Recentes</h2>
                  <button
                    onClick={() => navigate('/fontes')}
                    className="text-xs hover:underline"
                    style={{ color: '#C8F000' }}
                  >
                    Ver todas
                  </button>
                </div>

                {recentSources.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: '#A0A09A' }}>
                      Nenhuma fonte adicionada ainda.
                    </p>
                    <Button onClick={() => navigate('/fontes')} size="sm" className="mt-3">
                      <Plus size={14} />
                      Adicionar primeira fonte
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                        style={{ borderColor: '#2A2A26' }}
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="text-sm text-white truncate">
                            {source.input_type === 'url'
                              ? source.input_text
                              : source.input_text.slice(0, 80) + '...'}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: '#A0A09A' }}>
                            {formatDateTime(source.created_at)} ·{' '}
                            {source.classification?.blocos?.join(', ') || 'Sem classificação'}
                          </div>
                        </div>
                        <StatusBadge status={source.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Bloco coverage */}
            <div>
              <Card>
                <h2 className="text-sm font-semibold text-white mb-4">Cobertura por Bloco</h2>
                <div className="space-y-2">
                  {BLOCOS.map((bloco) => {
                    const covered = blocosComFonte.has(bloco)
                    return (
                      <div key={bloco} className="flex items-center gap-2">
                        {covered ? (
                          <CheckCircle2 size={14} style={{ color: '#C8F000', flexShrink: 0 }} />
                        ) : (
                          <Circle size={14} style={{ color: '#2A2A26', flexShrink: 0 }} />
                        )}
                        <span
                          className="text-xs"
                          style={{ color: covered ? '#FFFFFF' : '#A0A09A' }}
                        >
                          {bloco}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3 border-t" style={{ borderColor: '#2A2A26' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: '#A0A09A' }}>Cobertura</span>
                    <span style={{ color: '#C8F000' }}>
                      {blocosComFonte.size}/{BLOCOS.length}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2A2A26' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: '#C8F000',
                        width: `${(blocosComFonte.size / BLOCOS.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
