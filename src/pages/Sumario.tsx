import { useEffect, useState } from 'react'
import { Copy, RotateCcw, Save, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, type SumarioVersion } from '../lib/supabase'
import { Card, Button, PageHeader, Spinner, formatDateTime } from '../components/ui'

export default function Sumario() {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [versions, setVersions] = useState<SumarioVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<SumarioVersion | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [configResult, versionsResult] = await Promise.all([
      supabase.from('config').select('value').eq('key', 'current_sumario').single(),
      supabase
        .from('sumario_versions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const currentSumario = configResult.data?.value || ''
    setContent(currentSumario)
    setOriginalContent(currentSumario)
    setVersions(versionsResult.data || [])
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('config')
        .update({ value: content })
        .eq('key', 'current_sumario')

      if (error) throw error

      // Save version
      await supabase.from('sumario_versions').insert({
        content,
        version_label: `Salvo em ${new Date().toLocaleString('pt-BR')}`,
        source_id: null,
      })

      setOriginalContent(content)
      toast.success('Sumário salvo!')
      loadData()
    } catch {
      toast.error('Erro ao salvar sumário')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestore(version: SumarioVersion) {
    if (!confirm('Restaurar esta versão? O conteúdo atual será substituído.')) return

    const { error } = await supabase
      .from('config')
      .update({ value: version.content })
      .eq('key', 'current_sumario')

    if (error) {
      toast.error('Erro ao restaurar versão')
    } else {
      setContent(version.content)
      setOriginalContent(version.content)
      setSelectedVersion(null)
      toast.success('Versão restaurada!')
    }
  }

  const isDirty = content !== originalContent

  return (
    <div className="p-6">
      <PageHeader
        title="Sumário"
        description="Editor do sumário executivo do relatório"
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(content)
                toast.success('Copiado!')
              }}
              variant="secondary"
              size="sm"
            >
              <Copy size={14} />
              Copiar
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty}
              size="sm"
            >
              <Save size={14} />
              Salvar
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Editor */}
          <div className="col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium" style={{ color: '#A0A09A' }}>
                  SUMÁRIO ATUAL
                  {isDirty && (
                    <span className="ml-2 text-yellow-400">· Não salvo</span>
                  )}
                </div>
                <span className="text-xs" style={{ color: '#A0A09A' }}>
                  {content.length} caracteres
                </span>
              </div>
              <textarea
                value={selectedVersion ? selectedVersion.content : content}
                onChange={(e) => {
                  if (!selectedVersion) setContent(e.target.value)
                }}
                readOnly={!!selectedVersion}
                rows={30}
                className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 border outline-none focus:border-[#C8F000] transition-colors resize-none font-mono leading-relaxed"
                style={{
                  backgroundColor: '#0D1117',
                  borderColor: '#2A2A26',
                  opacity: selectedVersion ? 0.7 : 1,
                }}
                placeholder="O sumário do relatório aparecerá aqui. Você pode editá-lo diretamente ou aplicar updates a partir das fontes processadas."
              />
              {selectedVersion && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(200, 240, 0, 0.05)', border: '1px solid rgba(200, 240, 0, 0.2)' }}>
                  <span className="text-xs" style={{ color: '#C8F000' }}>
                    Visualizando versão: {selectedVersion.version_label}
                  </span>
                  <Button
                    onClick={() => handleRestore(selectedVersion)}
                    size="sm"
                    variant="secondary"
                  >
                    <RotateCcw size={12} />
                    Restaurar esta versão
                  </Button>
                  <Button
                    onClick={() => setSelectedVersion(null)}
                    size="sm"
                    variant="ghost"
                  >
                    Voltar ao atual
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Version history */}
          <div>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} style={{ color: '#A0A09A' }} />
                <h2 className="text-sm font-semibold text-white">Histórico de Versões</h2>
              </div>

              {versions.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: '#A0A09A' }}>
                  Nenhuma versão salva ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-3 rounded-lg border cursor-pointer transition-all"
                      style={{
                        borderColor: selectedVersion?.id === version.id ? '#C8F000' : '#2A2A26',
                        backgroundColor: selectedVersion?.id === version.id ? 'rgba(200, 240, 0, 0.05)' : 'transparent',
                      }}
                      onClick={() => setSelectedVersion(selectedVersion?.id === version.id ? null : version)}
                    >
                      <div className="text-xs font-medium text-white truncate">
                        {version.version_label}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#A0A09A' }}>
                        {formatDateTime(version.created_at)}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#A0A09A' }}>
                        {version.content.length} chars
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
