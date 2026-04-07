export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ConfiguracoesClient from '@/components/ConfiguracoesClient'

export default async function ConfiguracoesPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const { google } = await searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nome: true,
      email: true,
      oabNumero: true,
      oabUf: true,
      googleCalendarConnected: true,
    },
  })

  if (!usuario) redirect('/login')

  return <ConfiguracoesClient usuario={usuario} googleStatus={google} />
}
