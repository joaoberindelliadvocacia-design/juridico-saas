'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, Plus, Trash2, AlertCircle } from 'lucide-react'

interface Processo {
  id: string
  numeroCnj: string
  tipoAcao: string
  cliente: { id: string; nomeCompleto: string }
}

interface Parcela {
  valor: string
  dataVencimento: string
  descricao: string
}

export default function ModalHonorario({
  onClose,
  onSalvo,
}: {
  onClose: () => void
  onSalvo: () => void
}) {
  const searchRef = useRef<HTMLDivElement>(null)
  const [processo, setProcesso] = useState<Processo | null>(null)
  const [buscaProcesso, setBuscaProcesso] = useState('')
  const [processos, setProcessos] = useState<Processo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingProcessos, setLoadingProcessos] = useState(false)

  const [descricao, setDescricao] = useState('')
  const [parcelas, setParcelas] = useState<Parcela[]>([
    { valor: '', dataVencimento: '', descricao: 'Parcela 1' },
  ])

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!buscaProcesso.trim() || processo) return
    const timer = setTimeout(async () => {
      setLoadingProcessos(true)
      const res = await fetch(`/api/processos?busca=${encodeURIComponent(buscaProcesso)}`)
      if (res.ok) setProcessos(await res.json())
      setLoadingProcessos(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [buscaProcesso, processo])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const valorTotal = parcelas.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)

  function adicionarParcela() {
    setParcelas(prev => [...prev, { valor: '', dataVencimento: '', descricao: `Parcela ${prev.length + 1}` }])
  }

  function removerParcela(i: number) {
    setParcelas(prev => prev.filter((_, idx) => idx !== i))
  }

  function atualizarParcela(i: number, campo: keyof Parcela, valor: string) {
    setParcelas(prev => prev.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!processo) { setErro('Selecione um processo'); return }
    if (parcelas.some(p => !p.valor || !p.dataVencimento)) {
      setErro('Preencha valor e data de todas as parcelas')
      return
    }
    setLoading(true)
    const res = await fetch('/api/financeiro/honorarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        processoId: processo.id,
        clienteId: processo.cliente.id,
        valorTotal: valorTotal.toString(),
        descricao: descricao || null,
        parcelas: parcelas.map(p => ({ valor: p.valor, dataVencimento: p.dataVencimento, descricao: p.descricao })),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error || 'Erro ao salvar'); setLoading(false); return }
    onSalvo()
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none',
    boxSizing: 'border-box' as const, backgroundColor: 'white',
  }
  const labelStyle = { fontSize: '12px', fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: '5px' }
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Novo honorário</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Processo */}
          <div style={{ marginBottom: '16px' }} ref={searchRef}>
            <label style={labelStyle}>Processo <span style={{ color: '#ef4444' }}>*</span></label>
            {processo ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', fontFamily: 'monospace' }}>{processo.numeroCnj}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{processo.cliente.nomeCompleto}</div>
                </div>
                <button type="button" onClick={() => { setProcesso(null); setBuscaProcesso('') }} style={{ fontSize: '12px', color: '#8B7536', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Alterar</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={buscaProcesso} onChange={e => { setBuscaProcesso(e.target.value); setShowDropdown(true) }} onFocus={() => buscaProcesso && setShowDropdown(true)} placeholder="Buscar processo..." style={{ ...inputStyle, paddingLeft: '30px' }} />
                {showDropdown && buscaProcesso && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                    {loadingProcessos ? <div style={{ padding: '10px 14px', fontSize: '13px', color: '#94a3b8' }}>Buscando...</div>
                      : processos.length === 0 ? <div style={{ padding: '10px 14px', fontSize: '13px', color: '#94a3b8' }}>Nenhum processo</div>
                      : processos.map(p => (
                        <button key={p.id} type="button" onClick={() => { setProcesso(p); setBuscaProcesso(''); setShowDropdown(false) }}
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

          {/* Descrição */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Descrição (opcional)</label>
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: Honorários contratuais — Divórcio" style={inputStyle} />
          </div>

          {/* Parcelas */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Parcelas <span style={{ color: '#ef4444' }}>*</span></label>
              <button type="button" onClick={adicionarParcela} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#8B7536', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parcelas.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px auto', gap: '8px', alignItems: 'center' }}>
                  <input value={p.descricao} onChange={e => atualizarParcela(i, 'descricao', e.target.value)} placeholder={`Parcela ${i + 1}`} style={{ ...inputStyle, fontSize: '13px' }} />
                  <input type="number" value={p.valor} onChange={e => atualizarParcela(i, 'valor', e.target.value)} placeholder="R$ 0,00" min="0" step="0.01" style={{ ...inputStyle, fontSize: '13px' }} />
                  <input type="date" value={p.dataVencimento} onChange={e => atualizarParcela(i, 'dataVencimento', e.target.value)} style={{ ...inputStyle, fontSize: '13px' }} />
                  {parcelas.length > 1 && (
                    <button type="button" onClick={() => removerParcela(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {valorTotal > 0 && (
              <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: '#f0ead6', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Total</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#8B7536' }}>R$ {fmt(valorTotal)}</span>
              </div>
            )}
          </div>

          {erro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
              <AlertCircle size={14} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '13px', color: '#dc2626' }}>{erro}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, backgroundColor: loading ? '#c9b97a' : '#8B7536', color: 'white', border: 'none', cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Salvando...' : 'Cadastrar honorário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
