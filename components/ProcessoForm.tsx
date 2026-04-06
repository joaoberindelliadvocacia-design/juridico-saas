'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, AlertCircle, CheckCircle } from 'lucide-react'

interface Cliente {
  id: string
  nomeCompleto: string
  cpf: string
}

interface ProcessoFormProps {
  initialData?: {
    id: string
    numeroCnj: string
    tipoAcao: string
    status: string
    faseProcessual?: string
    varaJuizo?: string
    comarcaTribunal?: string
    dataDistribuicao?: string
    valorCausa?: string | number
    clienteId: string
    cliente: { id: string; nome: string; cpf: string }
  }
}

const TIPOS_ACAO = [
  { value: 'ALIMENTOS', label: 'Alimentos' },
  { value: 'GUARDA', label: 'Guarda' },
  { value: 'DIVORCIO_LITIGIOSO', label: 'Divórcio Litigioso' },
  { value: 'DIVORCIO_CONSENSUAL', label: 'Divórcio Consensual' },
  { value: 'REGULAMENTACAO_VISITAS', label: 'Regulamentação de Visitas' },
  { value: 'PARTILHA_BENS', label: 'Partilha de Bens' },
  { value: 'OUTRO', label: 'Outro' },
]

const FASES_PROCESSUAIS = [
  { value: 'PETICAO_INICIAL', label: 'Petição Inicial' },
  { value: 'CITACAO', label: 'Citação' },
  { value: 'INSTRUCAO', label: 'Instrução' },
  { value: 'SENTENCA', label: 'Sentença' },
  { value: 'RECURSO', label: 'Recurso' },
  { value: 'EXECUCAO', label: 'Execução' },
]

const STATUS_OPTIONS = [
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'SUSPENSO', label: 'Suspenso' },
  { value: 'ENCERRADO', label: 'Encerrado' },
]

// CNJ mask: NNNNNNN-DD.AAAA.J.TR.OOOO
function applyCNJMask(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 7) return digits
  if (digits.length <= 9) return `${digits.slice(0, 7)}-${digits.slice(7)}`
  if (digits.length <= 13) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9)}`
  if (digits.length <= 14) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13)}`
  if (digits.length <= 16) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14)}`
  if (digits.length <= 18) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16)}`
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`
}

function validateCNJ(value: string) {
  return /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(value)
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function ProcessoForm({ initialData }: ProcessoFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const searchRef = useRef<HTMLDivElement>(null)

  const [numeroCnj, setNumeroCnj] = useState(initialData?.numeroCnj || '')
  const [cnjValid, setCnjValid] = useState<boolean | null>(null)
  const [tipoAcao, setTipoAcao] = useState(initialData?.tipoAcao || '')
  const [status, setStatus] = useState(initialData?.status || 'EM_ANDAMENTO')
  const [faseProcessual, setFaseProcessual] = useState(initialData?.faseProcessual || '')
  const [varaJuizo, setVaraJuizo] = useState(initialData?.varaJuizo || '')
  const [comarcaTribunal, setComarcaTribunal] = useState(initialData?.comarcaTribunal || '')
  const [dataDistribuicao, setDataDistribuicao] = useState(
    initialData?.dataDistribuicao ? initialData.dataDistribuicao.slice(0, 10) : ''
  )
  const [valorCausa, setValorCausa] = useState(initialData?.valorCausa?.toString() || '')

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    initialData?.cliente ? { id: initialData.cliente.id, nomeCompleto: initialData.cliente.nome, cpf: initialData.cliente.cpf } : null
  )
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Busca clientes ao digitar
  useEffect(() => {
    if (!buscaCliente.trim() || clienteSelecionado) return
    const timer = setTimeout(async () => {
      setLoadingClientes(true)
      const res = await fetch(`/api/clientes?busca=${encodeURIComponent(buscaCliente)}`)
      if (res.ok) setClientes(await res.json())
      setLoadingClientes(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [buscaCliente, clienteSelecionado])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleCNJChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyCNJMask(e.target.value)
    setNumeroCnj(masked)
    if (masked.length === 25) {
      setCnjValid(validateCNJ(masked))
    } else {
      setCnjValid(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!validateCNJ(numeroCnj)) {
      setErro('Número CNJ inválido. Use o formato NNNNNNN-DD.AAAA.J.TR.OOOO')
      return
    }
    if (!tipoAcao) { setErro('Selecione o tipo de ação'); return }
    if (!clienteSelecionado) { setErro('Selecione um cliente'); return }

    setLoading(true)
    const body = {
      numeroCnj,
      tipoAcao,
      status,
      faseProcessual: faseProcessual || null,
      varaJuizo: varaJuizo || null,
      comarcaTribunal: comarcaTribunal || null,
      dataDistribuicao: dataDistribuicao || null,
      valorCausa: valorCausa || null,
      clienteId: clienteSelecionado.id,
    }

    const url = isEdit ? `/api/processos/${initialData!.id}` : '/api/processos'
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error || 'Erro ao salvar processo')
      setLoading(false)
      return
    }

    router.push(`/processos/${isEdit ? initialData!.id : data.id}`)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', color: '#1e293b', outline: 'none',
    boxSizing: 'border-box' as const, backgroundColor: 'white',
  }
  const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }
  const sectionStyle = { backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px' }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
      {/* Seção: Dados do processo */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px', borderBottom: '2px solid #8B7536', paddingBottom: '10px' }}>
          Dados do processo
        </h2>

        {/* Número CNJ */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Número CNJ <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              value={numeroCnj}
              onChange={handleCNJChange}
              placeholder="0000000-00.0000.0.00.0000"
              style={{
                ...inputStyle,
                fontFamily: 'monospace',
                fontSize: '15px',
                borderColor: cnjValid === false ? '#ef4444' : cnjValid === true ? '#22c55e' : '#e2e8f0',
                paddingRight: '40px',
              }}
            />
            {cnjValid === true && (
              <CheckCircle size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#22c55e' }} />
            )}
            {cnjValid === false && (
              <AlertCircle size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} />
            )}
          </div>
          {cnjValid === false && (
            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
              Formato inválido. Use: NNNNNNN-DD.AAAA.J.TR.OOOO
            </p>
          )}
          {cnjValid === true && (
            <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>Número CNJ válido</p>
          )}
        </div>

        {/* Tipo de ação + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Tipo de ação <span style={{ color: '#ef4444' }}>*</span></label>
            <select
              value={tipoAcao}
              onChange={e => setTipoAcao(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecione...</option>
              {TIPOS_ACAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Fase + Vara */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Fase processual</label>
            <select value={faseProcessual} onChange={e => setFaseProcessual(e.target.value)} style={inputStyle}>
              <option value="">Selecione...</option>
              {FASES_PROCESSUAIS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Vara / Juízo</label>
            <input
              value={varaJuizo}
              onChange={e => setVaraJuizo(e.target.value)}
              placeholder="Ex.: 1ª Vara de Família"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Comarca + Data distribuição + Valor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Comarca / Tribunal</label>
            <input
              value={comarcaTribunal}
              onChange={e => setComarcaTribunal(e.target.value)}
              placeholder="Ex.: Comarca do Rio de Janeiro"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Data de distribuição</label>
            <input type="date" value={dataDistribuicao} onChange={e => setDataDistribuicao(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Valor da causa (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorCausa}
              onChange={e => setValorCausa(e.target.value)}
              placeholder="0,00"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Seção: Cliente vinculado */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px', borderBottom: '2px solid #8B7536', paddingBottom: '10px' }}>
          Cliente vinculado
        </h2>

        {clienteSelecionado ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1a1a2e', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700,
              }}>
                {getInitials(clienteSelecionado.nomeCompleto)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{clienteSelecionado.nomeCompleto}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>CPF: {clienteSelecionado.cpf}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setClienteSelecionado(null); setBuscaCliente('') }}
              style={{ fontSize: '13px', color: '#8B7536', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Alterar
            </button>
          </div>
        ) : (
          <div ref={searchRef} style={{ position: 'relative' }}>
            <label style={labelStyle}>Buscar cliente <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={buscaCliente}
                onChange={e => { setBuscaCliente(e.target.value); setShowClienteDropdown(true) }}
                onFocus={() => buscaCliente && setShowClienteDropdown(true)}
                placeholder="Digite o nome ou CPF do cliente..."
                style={{ ...inputStyle, paddingLeft: '36px' }}
              />
            </div>
            {showClienteDropdown && buscaCliente && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px', maxHeight: '240px', overflowY: 'auto',
              }}>
                {loadingClientes ? (
                  <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '14px' }}>Buscando...</div>
                ) : clientes.length === 0 ? (
                  <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '14px' }}>Nenhum cliente encontrado</div>
                ) : (
                  clientes.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setClienteSelecionado(c); setBuscaCliente(''); setShowClienteDropdown(false) }}
                      style={{
                        width: '100%', padding: '10px 16px', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1a1a2e', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0,
                      }}>
                        {getInitials(c.nomeCompleto)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>{c.nomeCompleto}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>CPF: {c.cpf}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
          backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '20px',
        }}>
          <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', color: '#dc2626' }}>{erro}</span>
        </div>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            backgroundColor: loading ? '#c9b97a' : '#8B7536', color: 'white', border: 'none', cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar processo'}
        </button>
      </div>
    </form>
  )
}
