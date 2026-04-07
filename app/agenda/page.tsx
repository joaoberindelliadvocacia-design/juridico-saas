'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, CalendarDays } from 'lucide-react'

interface Prazo {
  id: string
  titulo: string
  dataVencimento: string
  status: string
  tipo: string
  processo?: { numero: string; tipoAcao: string } | null
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const TIPO_COR: Record<string, string> = {
  FATAL: '#ef4444',
  INTERNO: '#8B7536',
  AUDIENCIA: '#3b82f6',
  PERICIA: '#8b5cf6',
  OUTROS: '#64748b',
}

export default function AgendaPage() {
  const [prazos, setPrazos] = useState<Prazo[]>([])
  const [hoje] = useState(new Date())
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(hoje.getDate())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/prazos?status=PENDENTE&limit=200')
      .then(r => r.json())
      .then(data => { setPrazos(data.prazos || data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function diasNoMes(m: number, a: number) {
    return new Date(a, m + 1, 0).getDate()
  }

  function primeiroDiaSemana(m: number, a: number) {
    return new Date(a, m, 1).getDay()
  }

  function prazosNoDia(dia: number) {
    return prazos.filter(p => {
      const d = new Date(p.dataVencimento)
      return d.getFullYear() === ano && d.getMonth() === mes && d.getDate() === dia
    })
  }

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(a => a - 1) }
    else setMes(m => m - 1)
    setDiaSelecionado(null)
  }

  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(a => a + 1) }
    else setMes(m => m + 1)
    setDiaSelecionado(null)
  }

  const totalDias = diasNoMes(mes, ano)
  const offset = primeiroDiaSemana(mes, ano)
  const prazosHoje = diaSelecionado ? prazosNoDia(diaSelecionado) : []

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

        {/* Calendário */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Cabeçalho do mês */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <button onClick={mesAnterior} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#64748b' }}>
              <ChevronLeft size={20} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
              {MESES[mes]} {ano}
            </h2>
            <button onClick={proximoMes} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#64748b' }}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Dias da semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '12px 16px 0' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grade de dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '4px 16px 16px', gap: '2px' }}>
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: totalDias }).map((_, i) => {
              const dia = i + 1
              const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()
              const isSelecionado = dia === diaSelecionado
              const eventos = prazosNoDia(dia)
              const temFatal = eventos.some(p => p.tipo === 'FATAL')

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSelecionado(dia === diaSelecionado ? null : dia)}
                  style={{
                    position: 'relative',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 2px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    backgroundColor: isSelecionado ? '#1a1a2e' : isHoje ? '#fdf8ee' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelecionado && !isHoje) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc' }}
                  onMouseLeave={e => { if (!isSelecionado && !isHoje) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <span style={{
                    fontSize: '13px',
                    fontWeight: isHoje || isSelecionado ? 700 : 400,
                    color: isSelecionado ? 'white' : isHoje ? '#8B7536' : '#374151',
                  }}>
                    {dia}
                  </span>
                  {eventos.length > 0 && (
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {eventos.slice(0, 3).map((_, idx) => (
                        <div key={idx} style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          backgroundColor: isSelecionado ? 'white' : temFatal ? '#ef4444' : '#8B7536',
                        }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Painel lateral */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={16} style={{ color: '#8B7536' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                {diaSelecionado
                  ? `${diaSelecionado} de ${MESES[mes]}`
                  : 'Selecione um dia'}
              </h3>
            </div>
          </div>

          <div style={{ padding: '16px 20px', minHeight: '200px' }}>
            {loading ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Carregando...</p>
            ) : !diaSelecionado ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Clique em um dia para ver os eventos.</p>
            ) : prazosHoje.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Nenhum prazo neste dia.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {prazosHoje.map(p => (
                  <div key={p.id} style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${TIPO_COR[p.tipo] ?? '#64748b'}`,
                    backgroundColor: '#f8fafc',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      {p.tipo === 'FATAL'
                        ? <AlertTriangle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                        : <Clock size={13} style={{ color: TIPO_COR[p.tipo] ?? '#64748b', flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{p.titulo}</span>
                    </div>
                    {p.processo && (
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                        {p.processo.numero}
                      </p>
                    )}
                    <span style={{
                      display: 'inline-block', marginTop: '6px',
                      fontSize: '10px', fontWeight: 600, padding: '2px 6px',
                      borderRadius: '4px', backgroundColor: TIPO_COR[p.tipo] ? `${TIPO_COR[p.tipo]}20` : '#f1f5f9',
                      color: TIPO_COR[p.tipo] ?? '#64748b',
                    }}>
                      {p.tipo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
