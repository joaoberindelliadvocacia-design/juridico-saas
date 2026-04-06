import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import ProcessoForm from '@/components/ProcessoForm'

export default async function EditarProcessoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const processo = await prisma.processo.findFirst({
    where: { id, usuarioId: session.user.id },
    include: { cliente: true },
  })

  if (!processo) notFound()

  const initialData = {
    id: processo.id,
    numeroCnj: processo.numeroCnj,
    tipoAcao: processo.tipoAcao,
    status: processo.status,
    faseProcessual: processo.faseProcessual ?? undefined,
    varaJuizo: processo.varaJuizo ?? undefined,
    comarcaTribunal: processo.comarcaTribunal ?? undefined,
    dataDistribuicao: processo.dataDistribuicao?.toISOString() ?? undefined,
    valorCausa: processo.valorCausa?.toString() ?? undefined,
    clienteId: processo.clienteId,
    cliente: {
      id: processo.cliente.id,
      nome: processo.cliente.nomeCompleto,
      cpf: processo.cliente.cpf,
    },
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Editar processo</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px', fontFamily: 'monospace' }}>
          {processo.numeroCnj}
        </p>
      </div>
      <ProcessoForm initialData={initialData} />
    </div>
  )
}
