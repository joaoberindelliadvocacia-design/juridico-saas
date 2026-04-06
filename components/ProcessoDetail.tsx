'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Edit, Scale, User, Calendar, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react'

interface Andamento {
  id: string
  dataAndamento: string
  descricao: string
  tipo?: string | null
  origem: string
}

interface Prazo {
  id: string
  descricao: string
  tipoPrazo: string
  dataVencimento: string
  status: string
  horario?: string | null
}

interface Processo {
  id: string
  numeroCnj: string
  tipoAcao: string
  status: string
  faseProcessual?: string | null
  varaJuizo?: string | null
  comarcaTribunal?: string | null
  dataDistribuicao?: string | null
  valorCausa?: string | null
  createdAt: string
  updatedAt: string
  cliente: {
    id: string
    nome: string
    cpf: string
    celular: string
    email?: string | null
  }
  andamentos: Andamento[]
  prazos: Prazo[]
}

const TIPO_ACAO_LABEL: Record<string, string> = {
  ALIMENTOS: 'Alimentos',
  GUARDA: 'Guarda',
  DIVORCIO_LITIGIOSO: 'Divórcio Litigioso',
  DIVORCIO_CONSENSUAL: 'Divórcio Consensual',
  REGULAMENTACAO_VISITAS: 'Regulamentação de Visitas',
  PARTILHA_BENS: 'Partilha de Bens',
  OUTRO: 'Outro',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', bg: '#dcfce7', color: '#15803d' },
  SUSPENSO: { label: 'Suspenso', bg: '#fef9c3', color: '#854d0e' },
  ENCERRADO: { label: 'Encerrado', bg: '#f1f5f9', color: '#64748b' },
}

const TIPO_ANDAMENTO_LABEL: Record<string, string> = {
  DESPACHO: 'Despacho',
  SENTENCA: 'Sentença',
  PETICAO: 'Petição',
  PUBLICACAO_DJEN: 'Publicação DJEN',
  AUDIENCIA: 'Audiência',
  OUTRO: 'Outro',
}

function getSemaforico(dataVencimento: string, status: string) {
  if (status === 'CUMPRIDO') return { color: '#64748b', label: 'Cumprido' }
  const days = differenceInDays(parseISO(dataVencimento), new Date())
  if (days < 0) return { color: '#ef4444', label: `Vencido há ${Math.abs(days)} dia(s)` }
  if (days <= 2) return { color: '#ef4444', label: `${days} dia(s)` }
  if (days <= 5) return { color: '#f59e0b', label: `${days} dia(s)` }
  return { color: '#22c55e', label: `${days} dia(s)` }
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const TIPOS_ANDAMENTO = [
  { value: '', label: 'Selecione o tipo (opcional)' },
  { value: 'DESPACHO', label: 'Despacho' },
  { value: 'SENTENCA', label: 'Sentença' },
  { value: 'PETICAO', label: 'Petição' },
  { value: 'AUDIENCIA', label: 'Audiência' },
  { value: 'OUTRO', label: 'Outro' },
]

export default function ProcessoDetail({ processo: initial }: { processo: Processo }) {
  const [processo, setProcesso] = useState(initial)
  const [novoAndamento, setNovoAndamento] = useState('')
  const [tipoAndamento, setTipoAndamento] = useState('')
  const [dataAndamento, setDataAndamento] = useState(new Date().toISOString().slice(0, 10))
  const [savingAndamento, setSavingAndamento] = useState(false)
  const [erroAndamento, setErroAndamento] = useState('')

  const status = STATUS_CONFIG[processo.status] || STATUS_CONFIG.EM_ANDAMENTO

  async function salvarAndamento() {
    if (!novoAndamento.trim()) { setErroAndamento('Descrição é obrigatória'); return }
    setSavingAndamento(true)
    setErroAndamento('')
    const res = await fetch(`/api/processos/${processo.id}/andamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: novoAndamento, tipo: tipoAndamento || null, dataAndamento }),
    })
    if (res.ok) {
      const novo = await res.json()
      setProcesso(prev => ({
        ...prev,
        andamentos: [novo, ...prev.andamentos],
      }))
      setNovoAndamento('')
      setTipoAndamento('')
      setDataAndamento(new Date().toISOString().slice(0, 10))
    } else {
      const data = await res.json()
      setErroAndamento(data.error || 'Erro ao salvar andamento')
    }
    setSavingAndamento(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none',
    boxSizing: 'border-box' as const, backgroundColor: 'white',
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <Link href="/processos" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '8px' }}>
            <ArrowLeft size={14} /> Processos
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: 0, fontFamily: 'monospace' }}>
              {processo.numeroCnj}
            </h1>
            <span style={{
              padding: '3px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              backgroundColor: status.bg, color: status.color,
            }}>{status.label}</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            {TIPO_ACAO_LABEL[processo.tipoAcao] || processo.tipoAcao}
            {processo.varaJuizo && ` · ${processo.varaJuizo}`}
          </p>
        </div>
        <Link
          href={`/processos/${processo.id}/editar`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            backgroundColor: '#8B7536', color: 'white', textDecoration: 'none',
          }}
        >
          <Edit size={14} /> Editar
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Coluna principal */}
        <div>
          {/* Dados do processo */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dados do processo
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Tipo de ação', value: TIPO_ACAO_LABEL[processo.tipoAcao] || processo.tipoAcao },
                { label: 'Status', value: status.label },
                { label: 'Fase processual', value: processo.faseProcessual?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || '—' },
                { label: 'Vara / Juízo', value: processo.varaJuizo || '—' },
                { label: 'Comarca / Tribunal', value: processo.comarcaTribunal || '—' },
                { label: 'Data de distribuição', value: processo.dataDistribuicao ? format(parseISO(processo.dataDistribuicao), 'dd/MM/yyyy') : '—' },
                { label: 'Valor da causa', value: processo.valorCausa ? `R$ ${parseFloat(processo.valorCausa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—' },
                { label: 'Cadastrado em', value: format(parseISO(processo.createdAt), "dd/MM/yyyy 'às' HH:mm") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prazos */}
          {processo.prazos.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Prazos ({processo.prazos.length})
                </h2>
                <Link href="/prazos" style={{ fontSize: '13px', color: '#8B7536', textDecoration: 'none' }}>Ver todos →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {processo.prazos.map(p => {
                  const sem = getSemaforico(p.dataVencimento, p.status)
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                      backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${sem.color}`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '14px', color: '#1e293b' }}>{p.descricao}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {format(parseISO(p.dataVencimento), 'dd/MM/yyyy')}
                          {p.horario && ` às ${p.horario}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                          backgroundColor: p.tipoPrazo === 'FATAL' ? '#fee2e2' : '#dcfce7',
                          color: p.tipoPrazo === 'FATAL' ? '#b91c1c' : '#15803d',
                        }}>{p.tipoPrazo === 'FATAL' ? 'Fatal' : 'Interno'}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: sem.color }}>{sem.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Andamentos */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Andamentos processuais
            </h2>

            {/* Formulário inline */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Data</label>
                  <input
                    type="date"
                    value={dataAndamento}
                    onChange={e => setDataAndamento(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Tipo</label>
                  <select value={tipoAndamento} onChange={e => setTipoAndamento(e.target.value)} style={inputStyle}>
                    {TIPOS_ANDAMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Descrição do andamento</label>
                <textarea
                  value={novoAndamento}
                  onChange={e => setNovoAndamento(e.target.value)}
                  placeholder="Descreva o andamento processual..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              {erroAndamento && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>{erroAndamento}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={salvarAndamento}
                  disabled={savingAndamento}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    backgroundColor: savingAndamento ? '#c9b97a' : '#8B7536', color: 'white', border: 'none', cursor: savingAndamento ? 'default' : 'pointer',
                  }}
                >
                  <Plus size={14} /> {savingAndamento ? 'Salvando...' : 'Salvar andamento'}
                </button>
              </div>
            </div>

            {/* Timeline */}
            {processo.andamentos.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                Nenhum andamento registrado ainda.
              </p>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Linha vertical */}
                <div style={{ position: 'absolute', left: '11px', top: '4px', bottom: '4px', width: '2px', backgroundColor: '#e2e8f0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {processo.andamentos.map((a, i) => (
                    <div key={a.id} style={{ display: 'flex', gap: '16px', paddingBottom: i < processo.andamentos.length - 1 ? '20px' : '0', position: 'relative' }}>
                      {/* Ponto */}
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: a.origem === 'DJEN' ? '#22c55e' : '#3b82f6',
                        border: '3px solid white',
                        boxShadow: '0 0 0 2px ' + (a.origem === 'DJEN' ? '#22c55e' : '#3b82f6'),
                        zIndex: 1,
                      }} />
                      {/* Conteúdo */}
                      <div style={{ flex: 1, paddingTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                            {format(parseISO(a.dataAndamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                          {a.tipo && (
                            <span style={{
                              padding: '1px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                              backgroundColor: '#f1f5f9', color: '#475569',
                            }}>
                              {TIPO_ANDAMENTO_LABEL[a.tipo] || a.tipo}
                            </span>
                          )}
                          {a.origem === 'DJEN' && (
                            <span style={{
                              padding: '1px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                              backgroundColor: '#dcfce7', color: '#15803d',
                            }}>
                              DJEN
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: '#1e293b', margin: 0, lineHeight: '1.5' }}>{a.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral: cliente */}
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', position: 'sticky', top: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cliente (polo ativo)
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1a1a2e', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700,
              }}>
                {getInitials(processo.cliente.nome)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{processo.cliente.nome}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>CPF: {processo.cliente.cpf}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                <span style={{ color: '#94a3b8' }}>Celular: </span>
                {processo.cliente.celular}
              </div>
              {processo.cliente.email && (
                <div style={{ fontSize: '13px', color: '#475569' }}>
                  <span style={{ color: '#94a3b8' }}>E-mail: </span>
                  {processo.cliente.email}
                </div>
              )}
            </div>
            <Link
              href={`/clientes/${processo.cliente.id}`}
              style={{
                display: 'block', textAlign: 'center', padding: '8px 12px',
                border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                color: '#1a1a2e', textDecoration: 'none', backgroundColor: '#f8fafc',
              }}
            >
              Ver ficha do cliente
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
