'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, Heart } from 'lucide-react'
import { gerarIniciais, mascaraCPF, mascaraCelular } from '@/lib/validacoes'

interface Cliente {
  id: string
  nomeCompleto: string
  cpf: string
  celular: string
  email: string | null
  moduloFamilia: boolean
  _count: { processos: number }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  async function carregar(termo = '') {
    setCarregando(true)
    const res = await fetch(`/api/clientes?busca=${encodeURIComponent(termo)}`)
    const data = await res.json()
    setClientes(data)
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 300)
    return () => clearTimeout(t)
  }, [busca])

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir o cliente "${nome}"? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
    carregar(busca)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {carregando ? '...' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} cadastrado${clientes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          style={{ backgroundColor: '#8B7536' }}
        >
          <Plus size={16} />
          Novo cliente
        </Link>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ '--tw-ring-color': '#8B7536' } as React.CSSProperties}
        />
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          </p>
          {!busca && (
            <Link href="/clientes/novo" className="text-sm mt-2 inline-block" style={{ color: '#8B7536' }}>
              Cadastrar primeiro cliente →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CPF</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Celular</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Processos</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: '#1a1a2e' }}
                      >
                        {gerarIniciais(c.nomeCompleto)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900">{c.nomeCompleto}</span>
                          {c.moduloFamilia && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-50 text-pink-600">
                              <Heart size={9} />
                              Família
                            </span>
                          )}
                        </div>
                        {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{mascaraCPF(c.cpf)}</td>
                  <td className="px-4 py-3 text-gray-600">{mascaraCelular(c.celular)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {c._count.processos} processo{c._count.processos !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="text-xs font-medium text-gray-500 hover:text-gray-800 transition"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/clientes/${c.id}/editar`}
                        className="text-xs font-medium hover:opacity-80 transition"
                        style={{ color: '#8B7536' }}
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => excluir(c.id, c.nomeCompleto)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 transition"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
