'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Scale, AlertCircle } from 'lucide-react'

interface Processo {
  id: string
  numeroCnj: string
  tipoAcao: string
  status: string
  faseProcessual?: string
  varaJuizo?: string
  createdAt: string
  updatedAt: string
  cliente: { id: string; nomeCompleto: string }
  _count: { andamentos: number; prazos: number }
}

const TIPO_ACAO_LABEL: Record<string, string> = {
  ALIMENTOS: 'Alimentos',
  GUARDA: 'Guarda',
  DIVORCIO_LITIGIOSO: 'Divórcio Litigioso',
  DIVORCIO_CONSENSUAL: 'Divórcio Consensual',
  REGULAMENTACAO_VISITAS: 'Reg. de Visitas',
  PARTILHA_BENS: 'Partilha de Bens',
  OUTRO: 'Outro',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', bg: '#dcfce7', text: '#15803d' },
  SUSPENSO: { label: 'Suspenso', bg: '#fef9c3', text: '#854d0e' },
  ENCERRADO: { label: 'Encerrado', bg: '#f1f5f9', text: '#64748b' },
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProcessos()
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, statusFiltro])

  async function fetchProcessos() {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (statusFiltro) params.set('status', statusFiltro)
    const res = await fetch(`/api/processos?${params}`)
    if (res.ok) {
      const data = await res.json()
      setProcessos(data)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Processos</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            {processos.length} processo{processos.length !== 1 ? 's' : ''} encontrado{processos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/processos/novo"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#8B7536', color: 'white',
            padding: '10px 20px', borderRadius: '8px',
            textDecoration: 'none', fontSize: '14px', fontWeight: 600,
          }}
        >
          <Plus size={16} /> Novo processo
        </Link>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por CNJ, cliente ou vara..."
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              border: '1px solid #e2e8f0', borderRadius: '8px',
              fontSize: '14px', color: '#1e293b', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          style={{
            padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
            fontSize: '14px', color: '#1e293b', backgroundColor: 'white', minWidth: '160px',
          }}
        >
          <option value="">Todos os status</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="SUSPENSO">Suspenso</option>
          <option value="ENCERRADO">Encerrado</option>
        </select>
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
        ) : processos.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <Scale size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontWeight: 500 }}>Nenhum processo encontrado</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              {busca || statusFiltro ? 'Tente outros filtros.' : 'Cadastre o primeiro processo clicando em "Novo processo".'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Processo', 'Cliente', 'Tipo de ação', 'Fase', 'Status', 'Andamentos', ''].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processos.map((p, i) => {
                const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.EM_ANDAMENTO
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: i < processos.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                  >
                    {/* CNJ */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          backgroundColor: '#f0ead6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Scale size={16} style={{ color: '#8B7536' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
                            {p.numeroCnj}
                          </div>
                          {p.varaJuizo && (
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.varaJuizo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Cliente */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          backgroundColor: '#1a1a2e', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, flexShrink: 0,
                        }}>
                          {getInitials(p.cliente.nomeCompleto)}
                        </div>
                        <Link href={`/clientes/${p.cliente.id}`} style={{ color: '#1e293b', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#8B7536')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#1e293b')}
                        >
                          {p.cliente.nomeCompleto}
                        </Link>
                      </div>
                    </td>
                    {/* Tipo */}
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#334155' }}>
                      {TIPO_ACAO_LABEL[p.tipoAcao] || p.tipoAcao}
                    </td>
                    {/* Fase */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>
                      {p.faseProcessual?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || '—'}
                    </td>
                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: status.bg, color: status.text,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    {/* Andamentos */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                        {p._count.andamentos}
                      </span>
                    </td>
                    {/* Ações */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/processos/${p.id}`}
                          style={{
                            padding: '6px 12px', fontSize: '13px', fontWeight: 500,
                            color: '#1a1a2e', border: '1px solid #e2e8f0', borderRadius: '6px',
                            textDecoration: 'none', backgroundColor: 'white',
                          }}
                        >Ver</Link>
                        <Link
                          href={`/processos/${p.id}/editar`}
                          style={{
                            padding: '6px 12px', fontSize: '13px', fontWeight: 500,
                            color: '#8B7536', border: '1px solid #8B7536', borderRadius: '6px',
                            textDecoration: 'none', backgroundColor: 'white',
                          }}
                        >Editar</Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
