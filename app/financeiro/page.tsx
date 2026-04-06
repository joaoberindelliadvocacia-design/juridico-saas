'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, CheckCircle2, Clock, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react'
import ModalHonorario from '@/components/ModalHonorario'

interface Parcela {
  id: string
  valor: string
  dataVencimento: string
  dataPagamento?: string | null
  status: string
  descricao?: string | null
  asaasId?: string | null
  asaasPayLink?: string | null
  asaasBillingType?: string | null
}

interface Honorario {
  id: string
  valorTotal: string
  descricao?: string | null
  createdAt: string
  processo: { id: string; numeroCnj: string; tipoAcao: string }
  cliente: { id: string; nomeCompleto: string }
  parcelas: Parcela[]
}

const STATUS_CONFIG: Record<string, { label: string; cor: string; bg: string; icon: any }> = {
  PENDENTE: { label: 'Pendente', cor: '#f59e0b', bg: '#fef9c3', icon: Clock },
  PAGO: { label: 'Pago', cor: '#22c55e', bg: '#dcfce7', icon: CheckCircle2 },
  VENCIDO: { label: 'Vencido', cor: '#ef4444', bg: '#fee2e2', icon: AlertCircle },
}

function getStatusParcela(p: Parcela): string {
  if (p.status === 'PAGO') return 'PAGO'
  const d = differenceInCalendarDays(parseISO(p.dataVencimento), new Date())
  if (d < 0) return 'VENCIDO'
  return 'PENDENTE'
}

export default function FinanceiroPage() {
  const [honorarios, setHonorarios] = useState<Honorario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [gerandoCobranca, setGerandoCobranca] = useState<string | null>(null)

  const fetchHonorarios = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/financeiro/honorarios')
    if (res.ok) setHonorarios(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchHonorarios() }, [fetchHonorarios])

  // Métricas
  const todasParcelas = honorarios.flatMap(h => h.parcelas)
  const totalReceber = todasParcelas.filter(p => p.status === 'PENDENTE').reduce((s, p) => s + parseFloat(p.valor), 0)
  const totalRecebido = todasParcelas.filter(p => p.status === 'PAGO').reduce((s, p) => s + parseFloat(p.valor), 0)
  const totalVencido = todasParcelas.filter(p => getStatusParcela(p) === 'VENCIDO').reduce((s, p) => s + parseFloat(p.valor), 0)

  async function marcarPago(parcelaId: string, pago: boolean) {
    const res = await fetch(`/api/financeiro/parcelas/${parcelaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: pago ? 'PAGO' : 'PENDENTE' }),
    })
    if (res.ok) fetchHonorarios()
  }

  async function gerarCobrancaAsaas(parcelaId: string, billingType: 'PIX' | 'BOLETO') {
    setGerandoCobranca(parcelaId)
    const res = await fetch(`/api/financeiro/parcelas/${parcelaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gerarCobranca: true, billingType }),
    })
    const data = await res.json()
    if (res.ok) {
      fetchHonorarios()
    } else {
      alert(data.error || 'Erro ao gerar cobrança')
    }
    setGerandoCobranca(null)
  }

  async function copiarLink(link: string, id: string) {
    await navigator.clipboard.writeText(link)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Financeiro</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Honorários e cobranças via Asaas</p>
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
          <Plus size={16} /> Novo honorário
        </button>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'A receber', valor: totalReceber, cor: '#f59e0b', bg: '#fef9c3' },
          { label: 'Recebido', valor: totalRecebido, cor: '#22c55e', bg: '#dcfce7' },
          { label: 'Vencido', valor: totalVencido, cor: '#ef4444', bg: '#fee2e2' },
        ].map(({ label, valor, cor, bg }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginTop: '6px' }}>
              R$ {fmt(valor)}
            </div>
            <div style={{ height: '3px', backgroundColor: cor, borderRadius: '2px', marginTop: '12px', opacity: 0.6 }} />
          </div>
        ))}
      </div>

      {/* Lista de honorários */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
      ) : honorarios.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '64px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Nenhum honorário cadastrado</p>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Clique em "Novo honorário" para registrar os honorários de um processo.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {honorarios.map(h => {
            const totalPago = h.parcelas.filter(p => p.status === 'PAGO').reduce((s, p) => s + parseFloat(p.valor), 0)
            const progresso = (totalPago / parseFloat(h.valorTotal)) * 100

            return (
              <div key={h.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Cabeçalho */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <Link href={`/clientes/${h.cliente.id}`} style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', textDecoration: 'none' }}>
                        {h.cliente.nomeCompleto}
                      </Link>
                      <Link href={`/processos/${h.processo.id}`} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
                        {h.processo.numeroCnj}
                      </Link>
                    </div>
                    {h.descricao && <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>{h.descricao}</p>}
                    {/* Barra de progresso */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', minWidth: '120px' }}>
                        <div style={{ height: '100%', backgroundColor: '#22c55e', borderRadius: '3px', width: `${progresso}%`, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        R$ {fmt(totalPago)} / R$ {fmt(parseFloat(h.valorTotal))}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>R$ {fmt(parseFloat(h.valorTotal))}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{h.parcelas.length} parcela{h.parcelas.length > 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Parcelas */}
                <div>
                  {h.parcelas.map((p, i) => {
                    const statusEfetivo = getStatusParcela(p)
                    const cfg = STATUS_CONFIG[statusEfetivo]
                    const StatusIcon = cfg.icon
                    const temCobranca = !!p.asaasId
                    const gerando = gerandoCobranca === p.id

                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                        borderBottom: i < h.parcelas.length - 1 ? '1px solid #f8fafc' : 'none',
                        backgroundColor: statusEfetivo === 'VENCIDO' ? '#fffbeb' : 'white',
                      }}>
                        {/* Status icon */}
                        <StatusIcon size={16} style={{ color: cfg.cor, flexShrink: 0 }} />

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                              {p.descricao || `Parcela ${i + 1}`}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e' }}>
                              R$ {fmt(parseFloat(p.valor))}
                            </span>
                            <span style={{
                              padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                              backgroundColor: cfg.bg, color: cfg.cor,
                            }}>{cfg.label}</span>
                            {p.asaasBillingType && (
                              <span style={{
                                padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                                backgroundColor: '#eff6ff', color: '#2563eb',
                              }}>{p.asaasBillingType}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                            Vencimento: {format(parseISO(p.dataVencimento), 'dd/MM/yyyy')}
                            {p.dataPagamento && ` · Pago em ${format(parseISO(p.dataPagamento), 'dd/MM/yyyy')}`}
                          </div>
                        </div>

                        {/* Ações */}
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {/* Link de pagamento */}
                          {p.asaasPayLink && (
                            <>
                              <a href={p.asaasPayLink} target="_blank" rel="noopener noreferrer" style={{
                                padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid #3b82f6', color: '#3b82f6', textDecoration: 'none',
                                display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'white',
                              }}>
                                <ExternalLink size={11} /> Abrir
                              </a>
                              <button onClick={() => copiarLink(p.asaasPayLink!, p.id)} style={{
                                padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid #e2e8f0', color: '#64748b', backgroundColor: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px',
                              }}>
                                {copiado === p.id ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar link</>}
                              </button>
                            </>
                          )}

                          {/* Gerar cobrança Asaas */}
                          {!temCobranca && statusEfetivo !== 'PAGO' && (
                            <>
                              <button onClick={() => gerarCobrancaAsaas(p.id, 'PIX')} disabled={gerando} style={{
                                padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid #8B7536', color: '#8B7536', backgroundColor: 'white', cursor: gerando ? 'default' : 'pointer',
                                opacity: gerando ? 0.6 : 1,
                              }}>
                                {gerando ? '...' : '⚡ Pix'}
                              </button>
                              <button onClick={() => gerarCobrancaAsaas(p.id, 'BOLETO')} disabled={gerando} style={{
                                padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid #64748b', color: '#64748b', backgroundColor: 'white', cursor: gerando ? 'default' : 'pointer',
                                opacity: gerando ? 0.6 : 1,
                              }}>
                                Boleto
                              </button>
                            </>
                          )}

                          {/* Marcar pago/pendente */}
                          {statusEfetivo !== 'PAGO' ? (
                            <button onClick={() => marcarPago(p.id, true)} style={{
                              padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              border: '1px solid #22c55e', color: '#22c55e', backgroundColor: 'white', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                              <CheckCircle2 size={11} /> Marcar pago
                            </button>
                          ) : (
                            <button onClick={() => marcarPago(p.id, false)} style={{
                              padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              border: '1px solid #e2e8f0', color: '#94a3b8', backgroundColor: 'white', cursor: 'pointer',
                            }}>
                              Desfazer
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && (
        <ModalHonorario
          onClose={() => setModalAberto(false)}
          onSalvo={() => { fetchHonorarios(); setModalAberto(false) }}
        />
      )}
    </div>
  )
}
