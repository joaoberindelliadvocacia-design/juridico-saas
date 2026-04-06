'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, X, AlertCircle, ChevronRight, Trash2, UserCheck } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  etapa: string
  origem: string
  tipoDemanda: string
  observacoes?: string | null
  convertidoEm?: string | null
  createdAt: string
  updatedAt: string
  cliente?: { id: string; nomeCompleto: string } | null
}

const ETAPAS = [
  { key: 'NOVO_CONTATO', label: 'Novo Contato', cor: '#64748b', bg: '#f1f5f9' },
  { key: 'CONSULTA_AGENDADA', label: 'Consulta Agendada', cor: '#f59e0b', bg: '#fef9c3' },
  { key: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', cor: '#8B7536', bg: '#f0ead6' },
  { key: 'CONVERTIDO', label: 'Convertido', cor: '#22c55e', bg: '#dcfce7' },
  { key: 'SEM_INTERESSE', label: 'Sem Interesse', cor: '#ef4444', bg: '#fee2e2' },
]

const ORIGENS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  INDICACAO: 'Indicação',
  INSTAGRAM: 'Instagram',
  SITE: 'Site',
  OUTRO: 'Outro',
}

const DEMANDAS: Record<string, string> = {
  ALIMENTOS: 'Alimentos',
  GUARDA: 'Guarda',
  DIVORCIO: 'Divórcio',
  VISITAS: 'Visitas',
  OUTRO: 'Outro',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null)
  const [movendo, setMovendo] = useState<string | null>(null)

  // Form state
  const [nome, setNome] = useState('')
  const [origem, setOrigem] = useState('WHATSAPP')
  const [tipoDemanda, setTipoDemanda] = useState('DIVORCIO')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/leads')
    if (res.ok) setLeads(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setModalAberto(false); setLeadSelecionado(null) }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function abrirNovo() {
    setNome(''); setOrigem('WHATSAPP'); setTipoDemanda('DIVORCIO'); setObservacoes(''); setErro('')
    setModalAberto(true)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) { setErro('Nome é obrigatório'); return }
    setSalvando(true)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim(), origem, tipoDemanda, observacoes: observacoes.trim() || null }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error || 'Erro ao salvar'); setSalvando(false); return }
    setModalAberto(false)
    fetchLeads()
    setSalvando(false)
  }

  async function moverEtapa(lead: Lead, novaEtapa: string) {
    setMovendo(lead.id)
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa: novaEtapa }),
    })
    if (res.ok) fetchLeads()
    setMovendo(null)
    setLeadSelecionado(null)
  }

  async function deletarLead(id: string) {
    if (!confirm('Excluir este lead?')) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    fetchLeads()
    setLeadSelecionado(null)
  }

  async function salvarObservacoes(lead: Lead, obs: string) {
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes: obs }),
    })
    fetchLeads()
  }

  const colStyle = (etapa: typeof ETAPAS[0]): React.CSSProperties => ({
    flex: '0 0 240px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none',
    boxSizing: 'border-box', backgroundColor: 'white',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px',
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>CRM de Leads</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Gerencie seus potenciais clientes</p>
        </div>
        <button
          onClick={abrirNovo}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#8B7536', color: 'white',
            padding: '10px 20px', borderRadius: '8px',
            border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Novo lead
        </button>
      </div>

      {/* Métricas rápidas */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {ETAPAS.map(e => {
          const count = leads.filter(l => l.etapa === e.key).length
          return (
            <div key={e.key} style={{ padding: '12px 20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: '120px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: e.cor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{e.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e' }}>{count}</div>
            </div>
          )
        })}
      </div>

      {/* Kanban */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', alignItems: 'flex-start' }}>
          {ETAPAS.map(etapa => {
            const leadsEtapa = leads.filter(l => l.etapa === etapa.key)
            return (
              <div key={etapa.key} style={colStyle(etapa)}>
                {/* Cabeçalho coluna */}
                <div style={{ padding: '12px 14px', borderBottom: '2px solid ' + etapa.cor, backgroundColor: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: etapa.cor }}>{etapa.label}</span>
                    <span style={{
                      minWidth: '22px', height: '22px', borderRadius: '999px', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                      backgroundColor: etapa.bg, color: etapa.cor,
                    }}>{leadsEtapa.length}</span>
                  </div>
                </div>

                {/* Cards */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' }}>
                  {leadsEtapa.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#cbd5e1', fontSize: '13px' }}>Vazio</div>
                  )}
                  {leadsEtapa.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setLeadSelecionado(lead)}
                      style={{
                        backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0',
                        padding: '12px', cursor: 'pointer', transition: 'box-shadow 0.15s',
                        boxShadow: leadSelecionado?.id === lead.id ? '0 0 0 2px ' + etapa.cor : undefined,
                        opacity: movendo === lead.id ? 0.5 : 1,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = leadSelecionado?.id === lead.id ? '0 0 0 2px ' + etapa.cor : '')}
                    >
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', marginBottom: '6px' }}>{lead.nome}</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f0ead6', color: '#8B7536', fontWeight: 600 }}>
                          {DEMANDAS[lead.tipoDemanda] || lead.tipoDemanda}
                        </span>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>
                          {ORIGENS[lead.origem] || lead.origem}
                        </span>
                      </div>
                      {lead.observacoes && (
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', marginBottom: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                          {lead.observacoes}
                        </p>
                      )}
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px' }}>
                        {format(parseISO(lead.createdAt), "dd/MM/yy", { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Novo Lead */}
      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setModalAberto(false) }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Novo lead</h2>
              <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvar} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nome <span style={{ color: '#ef4444' }}>*</span></label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do potencial cliente" style={inputStyle} autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Origem <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={origem} onChange={e => setOrigem(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {Object.entries(ORIGENS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tipo de demanda <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={tipoDemanda} onChange={e => setTipoDemanda(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {Object.entries(DEMANDAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Observações</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Anotações sobre o contato..." rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              {erro && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                  <AlertCircle size={14} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '13px', color: '#dc2626' }}>{erro}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModalAberto(false)} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, backgroundColor: salvando ? '#c9b97a' : '#8B7536', color: 'white', border: 'none', cursor: salvando ? 'default' : 'pointer' }}>
                  {salvando ? 'Salvando...' : 'Cadastrar lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Painel lateral — Lead selecionado */}
      {leadSelecionado && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setLeadSelecionado(null) }}>
          <LeadPanel
            lead={leadSelecionado}
            onClose={() => setLeadSelecionado(null)}
            onMover={moverEtapa}
            onDeletar={deletarLead}
            onSalvarObs={salvarObservacoes}
            movendo={movendo === leadSelecionado.id}
          />
        </div>
      )}
    </div>
  )
}

function LeadPanel({
  lead, onClose, onMover, onDeletar, onSalvarObs, movendo,
}: {
  lead: Lead
  onClose: () => void
  onMover: (lead: Lead, etapa: string) => void
  onDeletar: (id: string) => void
  onSalvarObs: (lead: Lead, obs: string) => void
  movendo: boolean
}) {
  const [obs, setObs] = useState(lead.observacoes ?? '')
  const [editandoObs, setEditandoObs] = useState(false)

  const etapaAtual = ETAPAS.find(e => e.key === lead.etapa)
  const etapaIndex = ETAPAS.findIndex(e => e.key === lead.etapa)

  return (
    <div style={{ width: '360px', height: '100%', backgroundColor: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>{lead.nome}</h3>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
            fontSize: '12px', fontWeight: 700,
            backgroundColor: etapaAtual?.bg, color: etapaAtual?.cor,
          }}>{etapaAtual?.label}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', marginLeft: '12px' }}><X size={18} /></button>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Origem</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{ORIGENS[lead.origem] || lead.origem}</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Demanda</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{DEMANDAS[lead.tipoDemanda] || lead.tipoDemanda}</div>
          </div>
        </div>

        {/* Observações */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações</span>
            {!editandoObs && (
              <button onClick={() => setEditandoObs(true)} style={{ fontSize: '12px', color: '#8B7536', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Editar</button>
            )}
          </div>
          {editandoObs ? (
            <div>
              <textarea value={obs} onChange={e => setObs(e.target.value)} rows={4}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button onClick={() => { onSalvarObs(lead, obs); setEditandoObs(false) }}
                  style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: '#8B7536', color: 'white', border: 'none', cursor: 'pointer' }}>Salvar</button>
                <button onClick={() => { setObs(lead.observacoes ?? ''); setEditandoObs(false) }}
                  style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: obs ? '#1e293b' : '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              {obs || 'Sem observações'}
            </p>
          )}
        </div>

        {/* Mover etapa */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Mover para</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ETAPAS.filter(e => e.key !== lead.etapa).map(e => (
              <button key={e.key} onClick={() => onMover(lead, e.key)} disabled={movendo}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  backgroundColor: 'white', cursor: movendo ? 'default' : 'pointer',
                  fontSize: '14px', fontWeight: 600, color: e.cor, opacity: movendo ? 0.6 : 1,
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={ev => { if (!movendo) ev.currentTarget.style.backgroundColor = e.bg }}
                onMouseLeave={ev => { ev.currentTarget.style.backgroundColor = 'white' }}
              >
                <span>{e.label}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Link cliente se convertido */}
        {lead.etapa === 'CONVERTIDO' && lead.cliente && (
          <div style={{ padding: '12px 14px', backgroundColor: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>Convertido: {lead.cliente.nomeCompleto}</span>
          </div>
        )}

        {/* Data */}
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Cadastrado em {format(parseISO(lead.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Excluir */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
        <button onClick={() => onDeletar(lead.id)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          <Trash2 size={14} /> Excluir lead
        </button>
      </div>
    </div>
  )
}
