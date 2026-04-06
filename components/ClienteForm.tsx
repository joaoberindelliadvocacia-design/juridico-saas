'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2 } from 'lucide-react'
import { mascaraCPF, mascaraCelular, mascaraCEP } from '@/lib/validacoes'
import { buscarCEP } from '@/lib/viacep'

interface ClienteFormProps {
  inicial?: Partial<ClienteFormData>
  clienteId?: string
}

export interface ClienteFormData {
  nomeCompleto: string
  cpf: string
  celular: string
  email: string
  dataNascimento: string
  lembreteAniversario: boolean
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  pais: string
  moduloFamilia: boolean
}

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export function ClienteForm({ inicial, clienteId }: ClienteFormProps) {
  const router = useRouter()
  const [dados, setDados] = useState<ClienteFormData>({
    nomeCompleto: inicial?.nomeCompleto ?? '',
    cpf: inicial?.cpf ? mascaraCPF(inicial.cpf) : '',
    celular: inicial?.celular ? mascaraCelular(inicial.celular) : '',
    email: inicial?.email ?? '',
    dataNascimento: inicial?.dataNascimento ?? '',
    lembreteAniversario: inicial?.lembreteAniversario ?? false,
    cep: inicial?.cep ? mascaraCEP(inicial.cep) : '',
    logradouro: inicial?.logradouro ?? '',
    numero: inicial?.numero ?? '',
    complemento: inicial?.complemento ?? '',
    bairro: inicial?.bairro ?? '',
    cidade: inicial?.cidade ?? '',
    estado: inicial?.estado ?? '',
    pais: inicial?.pais ?? 'Brasil',
    moduloFamilia: inicial?.moduloFamilia ?? false,
  })
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [buscandoCEP, setBuscandoCEP] = useState(false)
  const [arquivoFamilia, setArquivoFamilia] = useState<File | null>(null)

  function set(campo: keyof ClienteFormData, valor: string | boolean) {
    setDados(d => ({ ...d, [campo]: valor }))
    setErros(e => { const n = { ...e }; delete n[campo]; return n })
  }

  async function handleCEP(valor: string) {
    const masked = mascaraCEP(valor)
    set('cep', masked)
    if (masked.replace(/\D/g, '').length === 8) {
      setBuscandoCEP(true)
      const end = await buscarCEP(masked)
      if (end) {
        setDados(d => ({
          ...d,
          logradouro: end.logradouro,
          bairro: end.bairro,
          cidade: end.cidade,
          estado: end.estado,
        }))
      }
      setBuscandoCEP(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const novosErros: Record<string, string> = {}

    if (!dados.nomeCompleto.trim()) novosErros.nomeCompleto = 'Nome é obrigatório'
    if (!dados.cpf.trim()) novosErros.cpf = 'CPF é obrigatório'
    if (!dados.celular.trim()) novosErros.celular = 'Celular é obrigatório'

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }

    setSalvando(true)
    try {
      const url = clienteId ? `/api/clientes/${clienteId}` : '/api/clientes'
      const method = clienteId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const json = await res.json()

      if (!res.ok) {
        setErros({ geral: json.error ?? 'Erro ao salvar' })
        setSalvando(false)
        return
      }

      router.push(`/clientes/${json.id}`)
      router.refresh()
    } catch {
      setErros({ geral: 'Erro de conexão' })
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {erros.geral && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {erros.geral}
        </div>
      )}

      {/* Dados pessoais */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Dados pessoais
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dados.nomeCompleto}
              onChange={e => set('nomeCompleto', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${erros.nomeCompleto ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Ex.: Maria Clara Silva"
            />
            {erros.nomeCompleto && <p className="text-red-500 text-xs mt-1">{erros.nomeCompleto}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dados.cpf}
              onChange={e => set('cpf', mascaraCPF(e.target.value))}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent font-mono ${erros.cpf ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            {erros.cpf && <p className="text-red-500 text-xs mt-1">{erros.cpf}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celular / WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dados.celular}
              onChange={e => set('celular', mascaraCelular(e.target.value))}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${erros.celular ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="(21) 99999-9999"
              maxLength={15}
            />
            {erros.celular && <p className="text-red-500 text-xs mt-1">{erros.celular}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={dados.email}
              onChange={e => set('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
            <input
              type="date"
              value={dados.dataNascimento}
              onChange={e => set('dataNascimento', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={dados.lembreteAniversario}
                onChange={e => set('lembreteAniversario', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Lembrete de aniversário</span>
            </label>
          </div>
        </div>
      </section>

      {/* Endereço */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Endereço
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <div className="relative">
              <input
                type="text"
                value={dados.cep}
                onChange={e => handleCEP(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="00000-000"
                maxLength={9}
              />
              {buscandoCEP && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <input
              type="text"
              value={dados.pais}
              onChange={e => set('pais', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
            <input
              type="text"
              value={dados.logradouro}
              onChange={e => set('logradouro', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="Rua, Av., etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              type="text"
              value={dados.numero}
              onChange={e => set('numero', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input
              type="text"
              value={dados.complemento}
              onChange={e => set('complemento', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="Apto, Bloco..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input
              type="text"
              value={dados.bairro}
              onChange={e => set('bairro', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              type="text"
              value={dados.cidade}
              onChange={e => set('cidade', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={dados.estado}
              onChange={e => set('estado', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            >
              <option value="">Selecione</option>
              {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Módulo família */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Módulo família
        </h3>
        <label className="flex items-center gap-2 cursor-pointer w-fit mb-4">
          <input
            type="checkbox"
            checked={dados.moduloFamilia}
            onChange={e => set('moduloFamilia', e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-700">Cliente — módulo família</span>
        </label>

        {dados.moduloFamilia && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planilha de despesas do menor
            </label>
            {arquivoFamilia ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm text-green-700 flex-1">{arquivoFamilia.name}</span>
                <button
                  type="button"
                  onClick={() => setArquivoFamilia(null)}
                  className="text-green-500 hover:text-green-700"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">Arraste ou clique para enviar</span>
                <span className="text-xs text-gray-400">.xlsx ou .pdf · máx. 10 MB</span>
                <input
                  type="file"
                  accept=".xlsx,.pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file && file.size <= 10 * 1024 * 1024) setArquivoFamilia(file)
                    else if (file) alert('Arquivo muito grande. Máximo 10 MB.')
                  }}
                />
              </label>
            )}
          </div>
        )}
      </section>

      {/* Botões */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={salvando}
          className="text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-60"
          style={{ backgroundColor: '#8B7536' }}
        >
          {salvando ? 'Salvando...' : clienteId ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
