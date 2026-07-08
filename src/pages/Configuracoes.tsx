import { useEffect, useState } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Trash2, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { Card, Button, PageHeader, Spinner } from '../components/ui'

export default function Configuracoes() {
  const [anthropicKey, setAnthropicKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearingTable, setClearingTable] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'anthropic_key')
      .single()
    setAnthropicKey(data?.value || '')
    setLoading(false)
  }

  async function handleSaveKey() {
    setSaving(true)
    const { error } = await supabase
      .from('config')
      .update({ value: anthropicKey })
      .eq('key', 'anthropic_key')

    if (error) {
      toast.error('Erro ao salvar chave')
    } else {
      toast.success('Chave salva!')
      setTestResult(null)
    }
    setSaving(false)
  }

  async function handleTestConnection() {
    if (!anthropicKey) {
      toast.error('Insira a chave da Anthropic primeiro')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Save the key first, then test via Edge Function
      await supabase
        .from('config')
        .update({ value: anthropicKey })
        .eq('key', 'anthropic_key')

      const { error } = await supabase.functions.invoke('process-source', {
        body: { test: true },
      })

      if (error) {
        setTestResult('error')
        toast.error('Conexão falhou: ' + error.message)
      } else {
        setTestResult('success')
        toast.success('Conexão com Anthropic funcionando!')
      }
    } catch {
      setTestResult('error')
      toast.error('Erro ao testar conexão')
    } finally {
      setTesting(false)
    }
  }

  async function handleClearTable(tableName: string) {
    if (!confirm(`Limpar TODOS os dados da tabela "${tableName}"? Esta ação não pode ser desfeita.`)) return

    setClearingTable(tableName)
    const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
      // Try alternative for config table (no id column)
      if (tableName === 'config') {
        toast.error('A tabela config não pode ser limpa desta forma')
      } else {
        toast.error(`Erro ao limpar ${tableName}`)
      }
    } else {
      toast.success(`Tabela ${tableName} limpa!`)
    }
    setClearingTable(null)
  }

  const setupChecklist = [
    { label: 'Supabase conectado', done: true },
    { label: 'Tabelas criadas', done: true },
    { label: 'Chave Anthropic configurada', done: !!anthropicKey },
    { label: 'Edge Function deployada', done: false },
  ]

  const dangerTables = ['sources', 'slides', 'texts', 'sumario_versions']

  return (
    <div className="p-6">
      <PageHeader
        title="Configurações"
        description="Configure a integração com a API da Anthropic"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* API Key */}
          <Card>
            <h2 className="text-sm font-semibold text-white mb-4">Chave da API Anthropic</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 pr-10 rounded-lg text-sm text-white border outline-none focus:border-[#C8F000] transition-colors"
                  style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <Button onClick={handleSaveKey} loading={saving} size="md">
                Salvar
              </Button>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={handleTestConnection}
                loading={testing}
                variant="secondary"
                size="sm"
              >
                Testar conexão
              </Button>
              {testResult === 'success' && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4ade80' }}>
                  <CheckCircle size={13} />
                  Conexão funcionando
                </div>
              )}
              {testResult === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <XCircle size={13} />
                  Falha na conexão
                </div>
              )}
            </div>
          </Card>

          {/* Setup checklist */}
          <Card>
            <h2 className="text-sm font-semibold text-white mb-4">Checklist de Setup</h2>
            <div className="space-y-2">
              {setupChecklist.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle size={15} style={{ color: '#C8F000' }} />
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{ borderColor: '#2A2A26' }}
                    />
                  )}
                  <span className="text-sm" style={{ color: done ? '#FFFFFF' : '#A0A09A' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(200, 240, 0, 0.05)', border: '1px solid rgba(200, 240, 0, 0.15)' }}>
              <p className="font-medium mb-1" style={{ color: '#C8F000' }}>Para deployar a Edge Function:</p>
              <code className="text-gray-300 block">
                supabase functions deploy process-source
              </code>
            </div>
          </Card>

          {/* Danger zone */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Settings size={15} style={{ color: '#ef4444' }} />
              <h2 className="text-sm font-semibold text-red-400">Zona de Risco</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: '#A0A09A' }}>
              Estas ações são irreversíveis. Use com cautela.
            </p>
            <div className="space-y-2">
              {dangerTables.map((table) => (
                <div
                  key={table}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: '#2A2A26' }}
                >
                  <span className="text-sm text-white font-mono">{table}</span>
                  <Button
                    onClick={() => handleClearTable(table)}
                    loading={clearingTable === table}
                    variant="danger"
                    size="sm"
                  >
                    <Trash2 size={12} />
                    Limpar tabela
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
