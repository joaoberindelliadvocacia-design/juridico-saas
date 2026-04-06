'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, Scale, Clock, FileText, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react'
import WidgetAniversarios from '@/components/WidgetAniversarios'

interface DashboardData {
  metricas: {
    totalClientes: number
    totalProcessosAtivos: number
    totalProcessosSuspensos: number
    totalProcessosEncerrados: number
    djenNaoLidas: number
    prazosVencidos: number
    prazosUrgentes: number
  }
  prazosProximos: Array<{
    id: string
    descricao: string
    tipoPrazo: string
    dataVencimento: string
    status: string
    processo: { id: string; numeroCnj: string; cliente: { nomeCompleto: string } }
  }>
  processosRecentes: Array<{
    id: string
    numeroCnj: string
    tipoAcao: string
    status: string
    updatedAt: string
    cliente: { nomeCompleto: string }
    _count: { andamentos: number }
  }>
  andamentosRecentes: Array<{
    id: string
    descricao: string
    tipo?: string | null
    dataAndamento: string
    processo: { id: string; numeroCnj: string; cliente: { nomeCompleto: string } }
  }>
  processosPorTipo: Array<{ tipoAcao: string; _count: number }>
}

const TIPO_ACAO_LABEL: Record<string, string> = {
  ALIMENTOS: 'Alimentos', GUARDA: 'Guarda',
  DIVORCIO_LITIGIOSO: 'Divórcio Litigioso', DIVORCIO_CONSENSUAL: 'Divórcio Consensual',
  REGULAMENTACAO_VISITAS: 'Reg. Visitas', PARTILHA_BENS: 'Partilha de Bens', OUTRO: 'Outro',
}

function getSemaforico(dataVencimento: string) {
  const d = differenceInCalendarDays(parseISO(dataVencimento), new Date())
  if (d < 0) return { cor: '#ef4444', bg: '#fee2e2', label: `Vencido` }
  if (d <= 2) return { cor: '#ef4444', bg: '#fee2e2', label: `${d}d` }
  if (d <= 5) return { cor: '#f59e0b', bg: '#fef9c3', label: `${d}d` }
  return { cor: '#22c55e', bg: '#dcfce7', label: `${d}d` }
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function CardMetrica({
  label, valor, sublabel, icon: Icon, cor, href,
}: {
  label: string; valor: number; sublabel?: string
  icon: any; cor: string; href: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
        padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.15s',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{valor}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{label}</div>
            {sublabel && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{sublabel}</div>}
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} style={{ color: cor }} />
          </div>
        </div>
        <div style={{ height: '3px', backgroundColor: cor, borderRadius: '2px', opacity: 0.6 }} />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hora, setHora] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    setHora(h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite')
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚖️</div>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { metricas, prazosProximos, processosRecentes, andamentosRecentes, processosPorTipo } = data

  // Gráfico de barras simples para tipos de ação
  const maxProcessos = Math.max(...processosPorTipo.map(p => p._count), 1)

  return (
    <div style={{ padding: '24px' }}>
      {/* Saudação */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
          {hora}, Doutor.
        </h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <CardMetrica label="Clientes" valor={metricas.totalClientes} icon={Users} cor="#8B7536" href="/clientes" />
        <CardMetrica label="Processos ativos" valor={metricas.totalProcessosAtivos} sublabel={`${metricas.totalProcessosSuspensos} suspensos · ${metricas.totalProcessosEncerrados} encerrados`} icon={Scale} cor="#1a1a2e" href="/processos" />
        <CardMetrica label="Prazos urgentes" valor={metricas.prazosVencidos + metricas.prazosUrgentes} sublabel={metricas.prazosVencidos > 0 ? `${metricas.prazosVencidos} vencido${metricas.prazosVencidos > 1 ? 's' : ''}` : '≤ 2 dias'} icon={AlertTriangle} cor="#ef4444" href="/prazos" />
        <CardMetrica label="DJEN não lidas" valor={metricas.djenNaoLidas} icon={FileText} cor="#3b82f6" href="/djen" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Coluna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Próximos prazos */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: '#8B7536' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Próximos prazos
                </h3>
              </div>
              <Link href="/prazos" style={{ fontSize: '13px', color: '#8B7536', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                Ver todos <ChevronRight size={13} />
              </Link>
            </div>
            {prazosProximos.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                Nenhum prazo pendente. 🎉
              </div>
            ) : (
              prazosProximos.map((p, i) => {
                const sem = getSemaforico(p.dataVencimento)
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                    borderBottom: i < prazosProximos.length - 1 ? '1px solid #f8fafc' : 'none',
                    borderLeft: `3px solid ${sem.cor}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.descricao}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {p.processo.cliente.nomeCompleto} · <span style={{ fontFamily: 'monospace' }}>{p.processo.numeroCnj}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {format(parseISO(p.dataVencimento), 'dd/MM/yyyy')}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                        backgroundColor: sem.bg, color: sem.cor,
                      }}>{sem.label}</span>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                        backgroundColor: p.tipoPrazo === 'FATAL' ? '#fee2e2' : '#f1f5f9',
                        color: p.tipoPrazo === 'FATAL' ? '#b91c1c' : '#64748b',
                      }}>{p.tipoPrazo === 'FATAL' ? 'FATAL' : 'INT.'}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Atividade recente */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} style={{ color: '#8B7536' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Atividade recente
              </h3>
            </div>
            {andamentosRecentes.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>Nenhum andamento registrado ainda.</div>
            ) : (
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {andamentosRecentes.map(a => (
                  <Link key={a.id} href={`/processos/${a.processo.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.descricao}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          {a.processo.cliente.nomeCompleto} · {format(parseISO(a.dataAndamento), "dd/MM/yyyy")}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Processos por tipo — gráfico de barras */}
          {processosPorTipo.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Scale size={16} style={{ color: '#8B7536' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Distribuição por tipo de ação
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {processosPorTipo.map(p => (
                  <div key={p.tipoAcao}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#374151' }}>{TIPO_ACAO_LABEL[p.tipoAcao] || p.tipoAcao}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{p._count}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${(p._count / maxProcessos) * 100}%`,
                        backgroundColor: '#8B7536',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Widget aniversários */}
          <WidgetAniversarios />

          {/* Processos recentes */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Processos recentes
              </h3>
              <Link href="/processos" style={{ fontSize: '13px', color: '#8B7536', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Ver todos <ChevronRight size={13} />
              </Link>
            </div>
            {processosRecentes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Nenhum processo cadastrado.
              </div>
            ) : (
              processosRecentes.map((p, i) => (
                <Link key={p.id} href={`/processos/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px',
                    borderBottom: i < processosRecentes.length - 1 ? '1px solid #f8fafc' : 'none',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f0ead6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Scale size={14} style={{ color: '#8B7536' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1e293b', fontWeight: 600 }}>
                        {p.numeroCnj}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.cliente.nomeCompleto}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                      {p._count.andamentos}a
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
