import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { gerarIniciais, mascaraCPF, mascaraCelular, mascaraCEP } from '@/lib/validacoes'
import { Pencil, FileText, Heart, Phone, Mail, MapPin, Calendar } from 'lucide-react'

const TIPO_ACAO_LABEL: Record<string, string> = {
  ALIMENTOS: 'Alimentos',
  GUARDA: 'Guarda',
  DIVORCIO_LITIGIOSO: 'Divórcio litigioso',
  DIVORCIO_CONSENSUAL: 'Divórcio consensual',
  REGULAMENTACAO_VISITAS: 'Regulamentação de visitas',
  PARTILHA_BENS: 'Partilha de bens',
  OUTRO: 'Outro',
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', color: 'bg-green-100 text-green-700' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-yellow-100 text-yellow-700' },
  ENCERRADO: { label: 'Encerrado', color: 'bg-gray-100 text-gray-600' },
}

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return notFound()

  const cliente = await prisma.cliente.findFirst({
    where: { id, usuarioId: session.user.id },
    include: {
      processos: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!cliente) return notFound()

  const enderecoCompleto = [
    cliente.logradouro,
    cliente.numero && `nº ${cliente.numero}`,
    cliente.complemento,
    cliente.bairro,
    cliente.cidade,
    cliente.estado,
  ].filter(Boolean).join(', ')

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: '#1a1a2e' }}
          >
            {gerarIniciais(cliente.nomeCompleto)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{cliente.nomeCompleto}</h2>
              {cliente.moduloFamilia && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-600">
                  <Heart size={10} /> Família
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-mono">{mascaraCPF(cliente.cpf)}</p>
          </div>
        </div>
        <Link
          href={`/clientes/${id}/editar`}
          className="inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ backgroundColor: '#8B7536' }}
        >
          <Pencil size={14} />
          Editar
        </Link>
      </div>

      {/* Contato */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contato</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone size={15} className="text-gray-400" />
            {mascaraCelular(cliente.celular)}
          </div>
          {cliente.email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail size={15} className="text-gray-400" />
              {cliente.email}
            </div>
          )}
          {cliente.dataNascimento && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar size={15} className="text-gray-400" />
              {new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')}
              {cliente.lembreteAniversario && (
                <span className="text-xs text-amber-600 font-medium">· lembrete ativo</span>
              )}
            </div>
          )}
          {enderecoCompleto && (
            <div className="flex items-start gap-2 text-sm text-gray-700 col-span-2">
              <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span>
                {enderecoCompleto}
                {cliente.cep && <span className="text-gray-400"> · {mascaraCEP(cliente.cep)}</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Processos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Processos ({cliente.processos.length})
          </h3>
          <Link
            href={`/processos/novo?clienteId=${cliente.id}`}
            className="text-xs font-medium hover:opacity-80"
            style={{ color: '#8B7536' }}
          >
            + Novo processo
          </Link>
        </div>

        {cliente.processos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum processo vinculado</p>
        ) : (
          <div className="space-y-2">
            {cliente.processos.map(p => (
              <Link
                key={p.id}
                href={`/processos/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <FileText size={15} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{TIPO_ACAO_LABEL[p.tipoAcao]}</p>
                    <p className="text-xs text-gray-400 font-mono">{p.numeroCnj}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_LABEL[p.status].color}`}>
                  {STATUS_LABEL[p.status].label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
