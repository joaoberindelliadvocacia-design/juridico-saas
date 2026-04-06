import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import ProcessoDetail from '@/components/ProcessoDetail'

export default async function ProcessoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const processo = await prisma.processo.findFirst({
    where: { id, usuarioId: session.user.id },
    include: {
      cliente: true,
      andamentos: { orderBy: { dataAndamento: 'desc' } },
      prazos: { orderBy: { dataVencimento: 'asc' } },
    },
  })

  if (!processo) notFound()

  const serialized = {
    ...processo,
    valorCausa: processo.valorCausa?.toString() ?? null,
    dataDistribuicao: processo.dataDistribuicao?.toISOString() ?? null,
    createdAt: processo.createdAt.toISOString(),
    updatedAt: processo.updatedAt.toISOString(),
    andamentos: processo.andamentos.map(a => ({
      ...a,
      dataAndamento: a.dataAndamento.toISOString(),
      createdAt: a.createdAt.toISOString(),
    })),
    prazos: processo.prazos.map(p => ({
      ...p,
      dataVencimento: p.dataVencimento.toISOString(),
      cumpridoEm: p.cumpridoEm?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    cliente: {
      id: processo.cliente.id,
      nome: processo.cliente.nomeCompleto,
      cpf: processo.cliente.cpf,
      celular: processo.cliente.celular,
      email: processo.cliente.email,
    },
  }

  return <ProcessoDetail processo={serialized} />
}
