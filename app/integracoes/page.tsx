export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import IntegracoesClient from '@/components/IntegracoesClient'

export default async function IntegracoesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { googleCalendarConnected: true },
  })

  const asaasConfigurado = !!process.env.ASAAS_API_KEY

  return (
    <IntegracoesClient
      googleConectado={usuario?.googleCalendarConnected ?? false}
      asaasConfigurado={asaasConfigurado}
    />
  )
}
