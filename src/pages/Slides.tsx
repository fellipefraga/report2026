import { useEffect, useState } from 'react'
import { Download, Check, Pencil, Trash2, Presentation } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, type Slide } from '../lib/supabase'
import {
  Card, Button, Badge, StatusBadge, PageHeader, EmptyState, Spinner
} from '../components/ui'

type Filter = 'all' | 'draft' | 'approved'

export default function Slides() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null)
  const [editForm, setEditForm] = useState<Partial<Slide>>({})

  useEffect(() => {
    loadSlides()
  }, [])

  async function loadSlides() {
    setLoading(true)
    const { data } = await supabase
      .from('slides')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
    setSlides(data || [])
    setLoading(false)
  }

  async function handleApprove(slide: Slide) {
    const newStatus = slide.status === 'approved' ? 'draft' : 'approved'
    const { error } = await supabase
      .from('slides')
      .update({ status: newStatus })
      .eq('id', slide.id)

    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      toast.success(newStatus === 'approved' ? 'Slide aprovado!' : 'Slide voltou para rascunho')
      loadSlides()
    }
  }

  async function handleDelete(slide: Slide) {
    if (!confirm('Excluir este slide? Esta ação não pode ser desfeita.')) return

    const { error } = await supabase.from('slides').delete().eq('id', slide.id)
    if (error) {
      toast.error('Erro ao excluir slide')
    } else {
      toast.success('Slide excluído')
      loadSlides()
    }
  }

  async function handleSaveEdit() {
    if (!editingSlide) return
    const { error } = await supabase
      .from('slides')
      .update(editForm)
      .eq('id', editingSlide.id)

    if (error) {
      toast.error('Erro ao salvar')
    } else {
      toast.success('Slide atualizado!')
      setEditingSlide(null)
      loadSlides()
    }
  }

  function handleExport() {
    const approvedSlides = slides.filter((s) => s.status === 'approved')
    if (approvedSlides.length === 0) {
      toast.error('Nenhum slide aprovado para exportar')
      return
    }

    const content = approvedSlides
      .map(
        (s, i) =>
          `--- SLIDE ${i + 1} ---\n[${s.bloco_deck}]\n${s.titulo}\n\nKPI: ${s.kpi_principal}\n\n${s.bullets.map((b) => `• ${b}`).join('\n')}\n\n${s.fonte_rodape}`
      )
      .join('\n\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stellar-deck-2026.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${approvedSlides.length} slides exportados!`)
  }

  const filtered = slides.filter((s) => filter === 'all' || s.status === filter)
  const approvedCount = slides.filter((s) => s.status === 'approved').length

  return (
    <div className="p-6">
      <PageHeader
        title="Slides"
        description="Gerencie os slides do deck do relatório"
        action={
          <Button onClick={handleExport} variant="secondary" size="sm">
            <Download size={14} />
            Exportar deck ({approvedCount})
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'approved'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-lg text-sm border transition-all"
            style={
              filter === f
                ? { backgroundColor: '#C8F000', color: '#0D1117', borderColor: '#C8F000' }
                : { backgroundColor: 'transparent', color: '#A0A09A', borderColor: '#2A2A26' }
            }
          >
            {f === 'all' ? 'Todos' : f === 'draft' ? 'Rascunho' : 'Aprovados'}
            <span className="ml-2 text-xs opacity-70">
              {f === 'all' ? slides.length : slides.filter((s) => s.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Presentation size={32} />}
          title="Nenhum slide encontrado"
          description="Processe fontes na página Fontes para gerar slides automaticamente."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((slide) => (
            <Card key={slide.id}>
              {/* Slide preview */}
              <div
                className="rounded-lg p-4 mb-3 border"
                style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="accent">{slide.bloco_deck}</Badge>
                  <StatusBadge status={slide.status} />
                </div>
                <div className="text-sm font-semibold text-white mb-2">{slide.titulo}</div>
                <div className="text-2xl font-bold mb-3" style={{ color: '#C8F000' }}>
                  {slide.kpi_principal}
                </div>
                <ul className="space-y-1 mb-3">
                  {(slide.bullets || []).map((b, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: '#A0A09A' }}>
                      <span style={{ color: '#C8F000' }}>·</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="text-xs" style={{ color: '#A0A09A' }}>
                  {slide.fonte_rodape}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleApprove(slide)}
                  variant={slide.status === 'approved' ? 'secondary' : 'primary'}
                  size="sm"
                >
                  <Check size={13} />
                  {slide.status === 'approved' ? 'Aprovado' : 'Aprovar'}
                </Button>
                <Button
                  onClick={() => {
                    setEditingSlide(slide)
                    setEditForm({
                      titulo: slide.titulo,
                      kpi_principal: slide.kpi_principal,
                      bullets: [...slide.bullets],
                      fonte_rodape: slide.fonte_rodape,
                      bloco_deck: slide.bloco_deck,
                    })
                  }}
                  variant="ghost"
                  size="sm"
                >
                  <Pencil size={13} />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(slide)}
                  variant="danger"
                  size="sm"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-lg rounded-xl border p-6"
            style={{ backgroundColor: '#1A1A16', borderColor: '#2A2A26' }}
          >
            <h3 className="text-base font-semibold text-white mb-4">Editar Slide</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#A0A09A' }}>
                  Bloco
                </label>
                <input
                  value={editForm.bloco_deck || ''}
                  onChange={(e) => setEditForm({ ...editForm, bloco_deck: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white border outline-none focus:border-[#C8F000]"
                  style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#A0A09A' }}>
                  Título
                </label>
                <input
                  value={editForm.titulo || ''}
                  onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white border outline-none focus:border-[#C8F000]"
                  style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#A0A09A' }}>
                  KPI Principal
                </label>
                <input
                  value={editForm.kpi_principal || ''}
                  onChange={(e) => setEditForm({ ...editForm, kpi_principal: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white border outline-none focus:border-[#C8F000]"
                  style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#A0A09A' }}>
                  Bullets (um por linha)
                </label>
                <textarea
                  value={(editForm.bullets || []).join('\n')}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bullets: e.target.value.split('\n').filter(Boolean) })
                  }
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white border outline-none focus:border-[#C8F000] resize-none"
                  style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: '#A0A09A' }}>
                  Fonte
                </label>
                <input
                  value={editForm.fonte_rodape || ''}
                  onChange={(e) => setEditForm({ ...editForm, fonte_rodape: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white border outline-none focus:border-[#C8F000]"
                  style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button onClick={() => setEditingSlide(null)} variant="ghost" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} size="sm">
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
