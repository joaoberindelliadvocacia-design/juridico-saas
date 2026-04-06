import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClienteForm } from '@/components/ClienteForm'

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return notFound()

  const cliente = await prisma.cliente.findFirst({
    where: { id, usuarioId: session.user.id },
  })
  if (!cliente) return notFound()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Editar cliente — {cliente.nomeCompleto}
      </h2>
      <ClienteForm
        clienteId={id}
        inicial={{
          nomeCompleto: cliente.nomeCompleto,
          cpf: cliente.cpf,
          celular: cliente.celular,
          email: cliente.email ?? '',
          dataNascimento: cliente.dataNascimento
            ? cliente.dataNascimento.toISOString().split('T')[0]
            : '',
          lembreteAniversario: cliente.lembreteAniversario,
          cep: cliente.cep ?? '',
          logradouro: cliente.logradouro ?? '',
          numero: cliente.numero ?? '',
          complemento: cliente.complemento ?? '',
          bairro: cliente.bairro ?? '',
          cidade: cliente.cidade ?? '',
          estado: cliente.estado ?? '',
          pais: cliente.pais ?? 'Brasil',
          moduloFamilia: cliente.moduloFamilia,
        }}
      />
    </div>
  )
}
