import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface AppShellProps {
  children: React.ReactNode
  titulo?: string
}

async function getBadges(usuarioId: string) {
  const [clientes, processos, prazosUrgentes, djenNaoLidas] = await Promise.all([
    prisma.cliente.count({ where: { usuarioId } }),
    prisma.processo.count({ where: { usuarioId, status: 'EM_ANDAMENTO' } }),
    prisma.prazo.count({
      where: {
        processo: { usuarioId },
        status: 'PENDENTE',
        dataVencimento: {
          lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.publicacao.count({
      where: {
        processo: { usuarioId },
        lida: false,
      },
    }),
  ])

  return { clientes, processos, prazosUrgentes, djenNaoLidas }
}

export async function AppShell({ children, titulo }: AppShellProps) {
  const session = await getServerSession(authOptions)
  const badges = session?.user?.id
    ? await getBadges(session.user.id)
    : {}

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar badges={badges} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar titulo={titulo} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
