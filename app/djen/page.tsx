'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Eye, EyeOff, Clock, CheckCheck, FileText, Plus, ExternalLink, AlertCircle } from 'lucide-react'
import ModalPrazo from '@/components/ModalPrazo'

interface Processo {
  id: string
  numeroCnj: string
  tipoAcao: string
  varaJuizo?: string | null
  cliente: { id: string; nomeCompleto: string }
}

interface Publicacao {
  id: string
  djenId: string
  numeroCnj: string
  tipoComunicacao?: string | null
  nomeOrgao?: string | null
  texto: string
  link?: string | null
  dataDisponibilizacao: string
  lida: boolean
  lidaEm?: string | null
  processo?: Processo | null
}

type FiltroLida = 'TODAS' | 'NAO_LIDAS' | 'LIDAS'

const TIPO_ACAO_LABEL: Record<string, string> = {
  ALIMENTOS: 'Alimentos', GUARDA: 'Guarda',
  DIVORCIO_LITIGIOSO: 'Divórcio Litigioso', DIVORCIO_CONSENSUAL: 'Divórcio Consensual',
  REGULAMENTACAO_VISITAS: 'Reg. Visitas', PARTILHA_BENS: 'Partilha de Bens', OUTRO: 'Outro',
}

export default function DjenPage() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroLida>('NAO_LIDAS')
  const [expandida, setExpandida] = useState<string | null>(null)
  const [modalPrazo, setModalPrazo] = useState<{ aberto: boolean; publicacao?: Publicacao }>({ aberto: false })

  const fetchPublicacoes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (filtro === 'NAO_LIDAS') params.set('lida', 'false')
    if (filtro === 'LIDAS') params.set('lida', 'true')
    const res = await fetch(`/api/djen?${params}`)
    if (res.ok) setPublicacoes(await res.json())
    setLoading(false)
  }, [busca, filtro])

  useEffect(() => {
    const timer = setTimeout(fetchPublicacoes, 300)
    return () => clearTimeout(timer)
  }, [fetchPublicacoes])

  async function marcarLida(id: string, lida: boolean) {
    const res = await fetch(`/api/djen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lida }),
    })
    if (res.ok) {
      setPublicacoes(prev => prev.map(p => p.id === id ? { ...p, lida } : p))
    }
  }

  async function marcarTodasLidas() {
    const naoLidas = publicacoes.filter(p => !p.lida)
    await Promise.all(naoLidas.map(p =>
      fetch(`/api/djen/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida: true }),
      })
    ))
    setPublicacoes(prev => prev.map(p => ({ ...p, lida: true })))
  }

  const naoLidas = publicacoes.filter(p => !p.lida).length

  const FILTROS: { key: FiltroLida; label: string; count?: number }[] = [
    { key: 'TODAS', label: 'Todas' },
    { key: 'NAO_LIDAS', label: 'Não lidas', count: naoLidas },
    { key: 'LIDAS', label: 'Lidas' },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>DJEN — Publicações</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Monitoramento do Diário da Justiça Eletrônico Nacional via PJe
          </p>
        </div>
        {naoLidas > 0 && (
          <button
            onClick={marcarTodasLidas}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer',
            }}
          >
            <CheckCheck size={16} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Aviso de configuração */}
      {!process.env.NEXT_PUBLIC_PJE_CONFIGURADO && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px',
          backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', marginBottom: '20px',
        }}>
          <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#92400e' }}>Integração PJe não configurada</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#92400e' }}>
              Para monitorar publicações automaticamente, preencha <code>PJE_NUMERO_OAB</code>, <code>PJE_UF_OAB</code> e <code>PJE_NOME_ADVOGADO</code> no arquivo <code>.env</code>.
            </p>
          </div>
        </div>
      )}

      {/* Busca e filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por CNJ, cliente, tipo..."
            style={{
              width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Tabs de filtro */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '0' }}>
        {FILTROS.map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)} style={{
            padding: '10px 20px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
            backgroundColor: 'transparent',
            color: filtro === f.key ? '#1a1a2e' : '#64748b',
            borderBottom: filtro === f.key ? '2px solid #8B7536' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span style={{
                backgroundColor: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700,
                padding: '1px 6px', borderRadius: '999px',
              }}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ backgroundColor: 'white', borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
        ) : publicacoes.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <FileText size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontWeight: 500 }}>
              {filtro === 'NAO_LIDAS' ? 'Nenhuma publicação não lida' : 'Nenhuma publicação encontrada'}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              {filtro === 'NAO_LIDAS' ? 'Você está em dia com o DJEN.' : 'Configure o PJe para receber publicações automaticamente.'}
            </p>
          </div>
        ) : (
          publicacoes.map((pub, i) => {
            const aberta = expandida === pub.id
            return (
              <div
                key={pub.id}
                style={{
                  borderBottom: i < publicacoes.length - 1 ? '1px solid #f1f5f9' : 'none',
                  backgroundColor: pub.lida ? 'white' : '#fefce8',
                }}
              >
                {/* Linha principal */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
                  {/* Indicador lida */}
                  <div style={{ paddingTop: '2px', flexShrink: 0 }}>
                    {pub.lida
                      ? <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                      : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                    }
                  </div>

                  {/* Conteúdo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {pub.tipoComunicacao && (
                        <span style={{
                          padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                          backgroundColor: '#eff6ff', color: '#2563eb',
                        }}>{pub.tipoComunicacao}</span>
                      )}
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                        {pub.numeroCnj}
                      </span>
                      {pub.processo && (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          · {pub.processo.cliente.nomeCompleto}
                          {pub.processo.varaJuizo && ` · ${pub.processo.varaJuizo}`}
                        </span>
                      )}
                      {!pub.processo && (
                        <span style={{
                          padding: '1px 6px', borderRadius: '4px', fontSize: '11px',
                          backgroundColor: '#fef9c3', color: '#854d0e',
                        }}>Processo não cadastrado</span>
                      )}
                    </div>

                    {pub.nomeOrgao && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{pub.nomeOrgao}</div>
                    )}

                    {/* Trecho do texto */}
                    <p style={{
                      fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: 0,
                      overflow: aberta ? 'visible' : 'hidden',
                      display: aberta ? 'block' : '-webkit-box',
                      WebkitLineClamp: aberta ? undefined : 2,
                      WebkitBoxOrient: aberta ? undefined : 'vertical' as any,
                    }}>
                      {pub.texto}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8' }}>
                        <Clock size={11} />
                        {format(parseISO(pub.dataDisponibilizacao), "dd/MM/yyyy", { locale: ptBR })}
                      </span>

                      <button
                        onClick={() => setExpandida(aberta ? null : pub.id)}
                        style={{ fontSize: '12px', color: '#8B7536', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        {aberta ? 'Ver menos' : 'Ver completo'}
                      </button>

                      {pub.link && (
                        <a
                          href={pub.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
                        >
                          <ExternalLink size={11} /> Abrir no PJe
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {pub.processo && (
                      <button
                        onClick={() => setModalPrazo({ aberto: true, publicacao: pub })}
                        title="Criar prazo a partir desta publicação"
                        style={{
                          padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                          border: '1px solid #8B7536', backgroundColor: 'white', color: '#8B7536', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <Plus size={12} /> Prazo
                      </button>
                    )}
                    <button
                      onClick={() => marcarLida(pub.id, !pub.lida)}
                      title={pub.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                      style={{
                        padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      {pub.lida ? <><EyeOff size={12} /> Não lida</> : <><Eye size={12} /> Lida</>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de criar prazo */}
      {modalPrazo.aberto && modalPrazo.publicacao?.processo && (
        <ModalPrazo
          processoPreSelecionado={modalPrazo.publicacao.processo as any}
          dadosDjen={{
            processoId: modalPrazo.publicacao.processo.id,
            descricao: `Prazo referente: ${modalPrazo.publicacao.tipoComunicacao ?? 'publicação DJEN'} — ${modalPrazo.publicacao.numeroCnj}`,
            dataVencimento: '',
            publicacaoId: modalPrazo.publicacao.id,
          }}
          onClose={() => setModalPrazo({ aberto: false })}
          onSalvo={() => {
            setModalPrazo({ aberto: false })
            marcarLida(modalPrazo.publicacao!.id, true)
          }}
        />
      )}
    </div>
  )
}
