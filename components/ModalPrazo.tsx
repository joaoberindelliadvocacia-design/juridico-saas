'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, AlertCircle, CheckCircle } from 'lucide-react'

interface Processo {
  id: string
  numeroCnj: string
  tipoAcao: string
  cliente: { nomeCompleto: string }
}

interface ModalPrazoProps {
  onClose: () => void
  onSalvo: (prazo: any) => void
  processoPreSelecionado?: Processo
  dadosDjen?: {
    processoId: string
    descricao: string
    dataVencimento: string
    publicacaoId?: string
  }
}

const TIPO_ACAO_LABEL: Record<string, string> = {
  ALIMENTOS: 'Alimentos', GUARDA: 'Guarda',
  DIVORCIO_LITIGIOSO: 'Divórcio Litigioso', DIVORCIO_CONSENSUAL: 'Divórcio Consensual',
  REGULAMENTACAO_VISITAS: 'Reg. Visitas', PARTILHA_BENS: 'Partilha de Bens', OUTRO: 'Outro',
}

// Tipos de ato processual
const TIPOS_ATO = [
  { value: 'AUDIENCIA',    label: 'Audiência',     emoji: '⚖️' },
  { value: 'CONTESTACAO',  label: 'Contestação',   emoji: '📝' },
  { value: 'RECURSO',      label: 'Recurso',       emoji: '📋' },
  { value: 'MANIFESTACAO', label: 'Manifestação',  emoji: '💬' },
  { value: 'OUTROS',       label: 'Outros',        emoji: '📌' },
]

export default function ModalPrazo({ onClose, onSalvo, processoPreSelecionado, dadosDjen }: ModalPrazoProps) {
  const searchRef = useRef<HTMLDivElement>(null)

  // Processo
  const [processoSelecionado, setProcessoSelecionado] = useState<Processo | null>(processoPreSelecionado || null)
  const [buscaProcesso, setBuscaProcesso]             = useState('')
  const [processos, setProcessos]                     = useState<Processo[]>([])
  const [showDropdown, setShowDropdown]               = useState(false)
  const [loadingProcessos, setLoadingProcessos]       = useState(false)

  // Campos do prazo
  const [descricao, setDescricao]           = useState(dadosDjen?.descricao || '')
  const [tipoPrazo, setTipoPrazo]           = useState<'FATAL' | 'INTERNO'>('FATAL')
  const [tipoAto, setTipoAto]               = useState<string>('')          // NOVO
  const [dataVencimento, setDataVencimento] = useState(dadosDjen?.dataVencimento?.slice(0, 10) || '')
  const [horario, setHorario]               = useState('')
  const [observacoes, setObservacoes]       = useState('')

  // Alertas
  const [alertaDias7, setAlertaDias7]         = useState(true)
  const [alertaDias5, setAlertaDias5]         = useState(true)
  const [alertaDias1, setAlertaDias1]         = useState(false)             // NOVO
  const [googleCalendar, setGoogleCalendar]   = useState(false)

  // UI
  const [loading, setLoading]   = useState(false)
  const [erro, setErro]         = useState('')
  const [sucesso, setSucesso]   = useState(false)

  // Quando tipoAto = AUDIENCIA, ativar alerta de 1 dia automaticamente
  useEffect(() => {
    if (tipoAto === 'AUDIENCIA') setAlertaDias1(true)
  }, [tipoAto])

  // Busca de processos com debounce
  useEffect(() => {
    if (!buscaProcesso.trim() || processoSelecionado) return
    const timer = setTimeout(async () => {
      setLoadingProcessos(true)
      const res = await fetch(`/api/processos?busca=${encodeURIComponent(buscaProcesso)}&status=EM_ANDAMENTO`)
      if (res.ok) setProcessos(await res.json())
      setLoadingProcessos(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [buscaProcesso, processoSelecionado])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fechar com ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!processoSelecionado) { setErro('Selecione um processo'); return }
    if (!descricao.trim())    { setErro('Descrição é obrigatória'); return }
    if (!dataVencimento)      { setErro('Data de vencimento é obrigatória'); return }

    setLoading(true)
    const res = await fetch('/api/prazos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        processoId:     processoSelecionado.id,
        descricao:      descricao.trim(),
        tipoPrazo,
        tipoAto:        tipoAto || null,          // NOVO
        dataVencimento,
        horario:        horario || null,
        alertaDias7,
        alertaDias5,
        alertaDias1,                              // NOVO
        googleCalendar,
        observacoes:    observacoes || null,
        ...(dadosDjen?.publicacaoId && { publicacaoId: dadosDjen.publicacaoId }),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error || 'Erro ao salvar prazo'); setLoading(false); return }
    setSucesso(true)
    setTimeout(() => { onSalvo(data) }, 1500)
  }

  // ── Estilos compartilhados ─────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '14px', color: '#1e293b', outline: 'none',
    boxSizing: 'border-box', backgroundColor: 'white',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600, color: '#374151',
    display: 'block', marginBottom: '6px',
  }
  const toggleStyle = (ativo: boolean): React.CSSProperties => ({
    width: '40px', height: '22px', borderRadius: '11px', border: 'none',
    cursor: 'pointer', backgroundColor: ativo ? '#8B7536' : '#cbd5e1',
    position: 'relative', flexShrink: 0, transition: 'background 0.2s',
  })
  const toggleKnob = (ativo: boolean): React.CSSProperties => ({
    position: 'absolute', top: '3px', left: ativo ? '21px' : '3px',
    width: '16px', height: '16px', borderRadius: '50%',
    backgroundColor: 'white', transition: 'left 0.2s',
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Novo prazo</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Banner DJEN */}
        {dadosDjen && (
          <div style={{ margin: '16px 24px 0', padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1d4ed8' }}>
            Prazo originado de publicação DJEN — campos pré-preenchidos
          </div>
        )}

        {/* Tela de sucesso */}
        {sucesso ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Prazo cadastrado!</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
              {(alertaDias1 || alertaDias5 || alertaDias7) ? 'Alertas por e-mail agendados.' : ''}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>

            {/* ── Processo ── */}
            <div style={{ marginBottom: '16px' }} ref={searchRef}>
              <label style={labelStyle}>Processo vinculado <span style={{ color: '#ef4444' }}>*</span></label>
              {processoSelecionado ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', fontFamily: 'monospace' }}>{processoSelecionado.numeroCnj}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{processoSelecionado.cliente.nomeCompleto} · {TIPO_ACAO_LABEL[processoSelecionado.tipoAcao]}</div>
                  </div>
                  {!processoPreSelecionado && (
                    <button type="button" onClick={() => { setProcessoSelecionado(null); setBuscaProcesso('') }}
                      style={{ fontSize: '12px', color: '#8B7536', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Alterar
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    value={buscaProcesso}
                    onChange={e => { setBuscaProcesso(e.target.value); setShowDropdown(true) }}
                    onFocus={() => buscaProcesso && setShowDropdown(true)}
                    placeholder="Buscar por CNJ ou cliente..."
                    style={{ ...inputStyle, paddingLeft: '32px' }}
                  />
                  {showDropdown && buscaProcesso && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                      {loadingProcessos ? (
                        <div style={{ padding: '10px 14px', fontSize: '13px', color: '#94a3b8' }}>Buscando...</div>
                      ) : processos.length === 0 ? (
                        <div style={{ padding: '10px 14px', fontSize: '13px', color: '#94a3b8' }}>Nenhum processo encontrado</div>
                      ) : processos.map(p => (
                        <button key={p.id} type="button"
                          onClick={() => { setProcessoSelecionado(p); setBuscaProcesso(''); setShowDropdown(false) }}
                          style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ fontWeight: 500, fontSize: '13px', color: '#1e293b', fontFamily: 'monospace' }}>{p.numeroCnj}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.cliente.nomeCompleto}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Descrição ── */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Descrição <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: Apresentar contestação" style={inputStyle} />
            </div>

            {/* ── Tipo de prazo ── */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Tipo <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {(['FATAL', 'INTERNO'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTipoPrazo(t)} style={{
                    padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                    border: `2px solid ${tipoPrazo === t ? (t === 'FATAL' ? '#ef4444' : '#22c55e') : '#e2e8f0'}`,
                    backgroundColor: tipoPrazo === t ? (t === 'FATAL' ? '#fee2e2' : '#dcfce7') : 'white',
                    color: tipoPrazo === t ? (t === 'FATAL' ? '#b91c1c' : '#15803d') : '#64748b',
                  }}>
                    {t === 'FATAL' ? '⚖️ Fatal (judicial)' : '📋 Interno (gerencial)'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tipo de ato — NOVO ── */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Tipo de ato <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>(opcional)</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {TIPOS_ATO.map(({ value, label, emoji }) => {
                  const ativo = tipoAto === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTipoAto(ativo ? '' : value)}
                      style={{
                        padding: '8px 4px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', textAlign: 'center', lineHeight: 1.4,
                        border: `2px solid ${ativo ? '#8B7536' : '#e2e8f0'}`,
                        backgroundColor: ativo ? '#fdf8ee' : 'white',
                        color: ativo ? '#8B7536' : '#64748b',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '18px', marginBottom: '2px' }}>{emoji}</div>
                      {label}
                    </button>
                  )
                })}
              </div>
              {tipoAto === 'AUDIENCIA' && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#8B7536', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>ℹ️</span> Alerta de 1 dia antes ativado automaticamente para audiências.
                </div>
              )}
            </div>

            {/* ── Data + Horário ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Data de vencimento <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Horário <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>(opcional)</span></label>
                <input type="time" value={horario} onChange={e => setHorario(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* ── Alertas ── */}
            <div style={{ marginBottom: '16px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Alertas por e-mail</div>

              {[
                { label: '7 dias antes', value: alertaDias7, set: setAlertaDias7 },
                { label: '5 dias antes', value: alertaDias5, set: setAlertaDias5 },
                { label: '1 dia antes',  value: alertaDias1, set: setAlertaDias1, destaque: tipoAto === 'AUDIENCIA' },
              ].map(({ label, value, set, destaque }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: destaque ? '#8B7536' : '#475569', fontWeight: destaque ? 600 : 400 }}>
                    {label}{destaque ? ' ⚖️' : ''}
                  </span>
                  <button type="button" onClick={() => set(!value)} style={toggleStyle(value)}>
                    <div style={toggleKnob(value)} />
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Google Calendar</span>
                <button type="button" onClick={() => setGoogleCalendar(!googleCalendar)} style={toggleStyle(googleCalendar)}>
                  <div style={toggleKnob(googleCalendar)} />
                </button>
              </div>
            </div>

            {/* ── Observações ── */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Observações <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8' }}>(opcional)</span></label>
              <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* ── Erro ── */}
            {erro && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
                <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#dc2626' }}>{erro}</span>
              </div>
            )}

            {/* ── Botões ── */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose}
                style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, backgroundColor: loading ? '#c9b97a' : '#8B7536', color: 'white', border: 'none', cursor: loading ? 'default' : 'pointer' }}>
                {loading ? 'Salvando...' : 'Cadastrar prazo'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  )
}
