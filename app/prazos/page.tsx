'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO, differenceInCalendarDays, startOfMonth, endOfMonth,
         eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import ModalPrazo from '@/components/ModalPrazo'

interface Processo {
  id: string
  numeroCnj: string
  tipoAcao: string
  varaJuizo?: string | null
  cliente: { id: string; nomeCompleto: string }
}

interface Prazo {
  id: string
  descricao: string
  tipoPrazo: string
  tipoAto?: string | null        // NOVO: Audiência, Contestação, Recurso, Manifestação, Outros
  dataVencimento: string
  horario?: string | null
  status: string
  processo: Processo
}

type FiltroTipo = 'TODOS' | 'FATAL' | 'INTERNO' | 'PENDENTE' | 'CUMPRIDO'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSemaforico(dataVencimento: string, status: string) {
  if (status === 'CUMPRIDO') return { cor: '#94a3b8', label: 'Cumprido', bg: '#f1f5f9' }
  const days = differenceInCalendarDays(parseISO(dataVencimento), new Date())
  if (days < 0)  return { cor: '#ef4444', label: 'Vencido', bg: '#fee2e2' }
  if (days <= 2) return { cor: '#ef4444', label: `${days}d`, bg: '#fee2e2' }
  if (days <= 5) return { cor: '#f59e0b', label: `${days}d`, bg: '#fef9c3' }
  return { cor: '#22c55e', label: `${days}d`, bg: '#dcfce7' }
}

function getCorDia(prazos: Prazo[], dia: Date): string | null {
  const dosDia = prazos.filter(p => isSameDay(parseISO(p.dataVencimento), dia))
  if (!dosDia.length) return null
  const sems = dosDia.map(p => getSemaforico(p.dataVencimento, p.status))
  if (sems.some(s => s.cor === '#ef4444')) return '#ef4444'
  if (sems.some(s => s.cor === '#f59e0b')) return '#f59e0b'
  return '#22c55e'
}

// Ícone por tipo de ato
const ICONE_ATO: Record<string, string> = {
  AUDIENCIA:    '⚖️',
  CONTESTACAO:  '📝',
  RECURSO:      '📋',
  MANIFESTACAO: '💬',
  OUTROS:       '📌',
}

const FILTROS: { key: FiltroTipo; label: string }[] = [
  { key: 'TODOS',    label: 'Todos'     },
  { key: 'FATAL',    label: 'Fatais'    },
  { key: 'INTERNO',  label: 'Internos'  },
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'CUMPRIDO', label: 'Cumpridos' },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PrazosPage() {
  const [prazos, setPrazos]               = useState<Prazo[]>([])
  const [loading, setLoading]             = useState(true)
  const [filtro, setFiltro]               = useState<FiltroTipo>('TODOS')
  const [mesAtual, setMesAtual]           = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)
  const [modalAberto, setModalAberto]     = useState(false)

  const fetchPrazos = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/prazos')
    if (res.ok) setPrazos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchPrazos() }, [fetchPrazos])

  async function marcarCumprido(id: string, cumprido: boolean) {
    const res = await fetch(`/api/prazos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: cumprido ? 'CUMPRIDO' : 'PENDENTE' }),
    })
    if (res.ok) {
      const atualizado = await res.json()
      setPrazos(prev => prev.map(p => p.id === id ? { ...p, status: atualizado.status } : p))
    }
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  const prazosFiltrados = prazos.filter(p => {
    if (filtro === 'FATAL')    return p.tipoPrazo === 'FATAL'
    if (filtro === 'INTERNO')  return p.tipoPrazo === 'INTERNO'
    if (filtro === 'PENDENTE') return p.status === 'PENDENTE'
    if (filtro === 'CUMPRIDO') return p.status === 'CUMPRIDO'
    return true
  })

  const prazosVisiveis = diaSelecionado
    ? prazosFiltrados.filter(p => isSameDay(parseISO(p.dataVencimento), diaSelecionado))
    : prazosFiltrados

  // ── Métricas ───────────────────────────────────────────────────────────────
  const hoje = new Date()
  const pendentes  = prazos.filter(p => p.status === 'PENDENTE')
  const vencidos   = pendentes.filter(p => differenceInCalendarDays(parseISO(p.dataVencimento), hoje) < 0).length
  const urgentes   = pendentes.filter(p => { const d = differenceInCalendarDays(parseISO(p.dataVencimento), hoje); return d >= 0 && d <= 2 }).length
  const atencao    = pendentes.filter(p => { const d = differenceInCalendarDays(parseISO(p.dataVencimento), hoje); return d >= 3 && d <= 5 }).length
  const noPrazo    = pendentes.filter(p => differenceInCalendarDays(parseISO(p.dataVencimento), hoje) > 5).length

  // ── Calendário ─────────────────────────────────────────────────────────────
  const diasDoMes   = eachDayOfInterval({ start: startOfMonth(mesAtual), end: endOfMonth(mesAtual) })
  const primeiroDow = getDay(startOfMonth(mesAtual))
  const diasPadding = Array(primeiroDow).fill(null)

  // ── Render helpers ─────────────────────────────────────────────────────────
  const CardMetrica = ({ label, valor, cor }: { label: string; valor: number; cor: string }) => (
    <div style={{ backgroundColor: 'var(--card)', borderRadius: '10px', border: `1px solid ${cor}25`, padding: '16px 20px', flex: 1 }}>
      <div style={{ fontSize: '28px', fontWeight: 700, color: cor }}>{valor}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
      <div style={{ height: '3px', backgroundColor: cor, borderRadius: '2px', marginTop: '10px', opacity: 0.5 }} />
    </div>
  )

  return (
    <div style={{ padding: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Prazos e Agenda</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {pendentes.length} pendentes
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#8B7536', color: 'white',
            padding: '10px 20px', borderRadius: '8px',
            border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Novo prazo
        </button>
      </div>

      {/* ── Métricas ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <CardMetrica label="Vencidos"         valor={vencidos} cor="#ef4444" />
        <CardMetrica label="Urgentes (≤2d)"   valor={urgentes} cor="#ef4444" />
        <CardMetrica label="Atenção (3–5d)"   valor={atencao}  cor="#f59e0b" />
        <CardMetrica label="No prazo (6+d)"   valor={noPrazo}  cor="#22c55e" />
      </div>

      {/* ── Layout principal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Calendário ── */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px' }}>

          {/* Navegação do mês */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button
              onClick={() => { setMesAtual(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); setDiaSelecionado(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>
              {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={() => { setMesAtual(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); setDiaSelecionado(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Cabeçalho dias da semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Grade de dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {diasPadding.map((_, i) => <div key={`pad-${i}`} />)}
            {diasDoMes.map(dia => {
              const cor       = getCorDia(prazos, dia)
              const selecionado = diaSelecionado && isSameDay(dia, diaSelecionado)
              const eHoje     = isToday(dia)
              return (
                <button
                  key={dia.toISOString()}
                  onClick={() => setDiaSelecionado(prev => prev && isSameDay(prev, dia) ? null : dia)}
                  style={{
                    position: 'relative', padding: '6px 4px', borderRadius: '6px', border: 'none',
                    backgroundColor: selecionado ? '#1a1a2e' : eHoje ? '#f0ead6' : 'transparent',
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <span style={{
                    fontSize: '13px', fontWeight: eHoje ? 700 : 400,
                    color: selecionado ? 'white' : eHoje ? '#8B7536' : 'var(--text)',
                    display: 'block',
                  }}>
                    {dia.getDate()}
                  </span>
                  {cor && (
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: selecionado ? 'white' : cor, margin: '2px auto 0' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legenda */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            {[
              { cor: '#22c55e', label: 'No prazo'        },
              { cor: '#f59e0b', label: 'Atenção'          },
              { cor: '#ef4444', label: 'Urgente / Vencido'},
            ].map(({ cor, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cor, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Botão limpar filtro de dia */}
          {diaSelecionado && (
            <button
              onClick={() => setDiaSelecionado(null)}
              style={{
                marginTop: '12px', width: '100%', padding: '6px', fontSize: '12px',
                color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px',
                backgroundColor: 'transparent', cursor: 'pointer',
              }}
            >
              Limpar filtro de data
            </button>
          )}
        </div>

        {/* ── Lista de prazos ── */}
        <div style={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>

          {/* Abas de filtro */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {FILTROS.map(f => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                style={{
                  flex: 1, padding: '12px 8px', fontSize: '13px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  backgroundColor: filtro === f.key ? 'var(--bg)' : 'var(--card)',
                  color: filtro === f.key ? 'var(--text)' : 'var(--text-muted)',
                  borderBottom: filtro === f.key ? '2px solid #8B7536' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Banner do dia selecionado */}
          {diaSelecionado && (
            <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
              Mostrando prazos de{' '}
              <strong style={{ color: 'var(--text)' }}>
                {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
              </strong>
            </div>
          )}

          {/* Conteúdo */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
          ) : prazosVisiveis.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 500 }}>Nenhum prazo encontrado</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                {diaSelecionado ? 'Nenhum prazo neste dia.' : 'Cadastre um prazo clicando em "Novo prazo".'}
              </p>
            </div>
          ) : (
            <div>
              {prazosVisiveis.map((prazo, i) => {
                const sem     = getSemaforico(prazo.dataVencimento, prazo.status)
                const cumprido = prazo.status === 'CUMPRIDO'
                const icone   = prazo.tipoAto ? (ICONE_ATO[prazo.tipoAto] ?? '📌') : null

                return (
                  <div
                    key={prazo.id}
                    style={{
                      display: 'flex', alignItems: 'stretch',
                      borderBottom: i < prazosVisiveis.length - 1 ? '1px solid var(--border)' : 'none',
                      opacity: cumprido ? 0.55 : 1,
                    }}
                  >
                    {/* Barra lateral colorida */}
                    <div style={{ width: '4px', backgroundColor: sem.cor, flexShrink: 0 }} />

                    {/* Conteúdo do prazo */}
                    <div style={{ flex: 1, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1 }}>

                          {/* Título + badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {icone && <span style={{ fontSize: '14px' }}>{icone}</span>}
                            <span style={{
                              fontSize: '14px', fontWeight: 600, color: 'var(--text)',
                              textDecoration: cumprido ? 'line-through' : 'none',
                            }}>
                              {prazo.descricao}
                            </span>

                            {/* Badge Fatal/Interno */}
                            <span style={{
                              padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                              backgroundColor: prazo.tipoPrazo === 'FATAL' ? '#fee2e2' : '#dcfce7',
                              color:           prazo.tipoPrazo === 'FATAL' ? '#b91c1c' : '#15803d',
                            }}>
                              {prazo.tipoPrazo === 'FATAL' ? 'Fatal' : 'Interno'}
                            </span>

                            {/* Badge Tipo de ato */}
                            {prazo.tipoAto && prazo.tipoAto !== 'OUTROS' && (
                              <span style={{
                                padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                                backgroundColor: '#e0f2fe', color: '#0369a1',
                              }}>
                                {prazo.tipoAto.charAt(0) + prazo.tipoAto.slice(1).toLowerCase()}
                              </span>
                            )}
                          </div>

                          {/* Processo e cliente */}
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {prazo.processo.cliente.nomeCompleto} · {prazo.processo.numeroCnj}
                            {prazo.processo.varaJuizo && ` · ${prazo.processo.varaJuizo}`}
                          </div>

                          {/* Data + semáforo */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {format(parseISO(prazo.dataVencimento), 'dd/MM/yyyy')}
                              {prazo.horario && ` às ${prazo.horario}`}
                            </span>
                            <span style={{
                              fontSize: '12px', fontWeight: 700, color: sem.cor,
                              padding: '1px 6px', borderRadius: '4px', backgroundColor: sem.bg,
                            }}>
                              {cumprido ? 'Cumprido' : sem.label}
                            </span>
                          </div>
                        </div>

                        {/* Checkbox cumprimento */}
                        <button
                          onClick={() => marcarCumprido(prazo.id, !cumprido)}
                          title={cumprido ? 'Marcar como pendente' : 'Marcar como cumprido'}
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
                            border:           cumprido ? 'none' : '2px solid #cbd5e1',
                            backgroundColor:  cumprido ? '#22c55e' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {cumprido && <Check size={14} style={{ color: 'white' }} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalPrazo
          onClose={() => setModalAberto(false)}
          onSalvo={(novo: Prazo) => {
            setPrazos(prev => [novo, ...prev])
            setModalAberto(false)
          }}
        />
      )}
    </div>
  )
}
