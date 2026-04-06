import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  const atualizada = await prisma.publicacao.update({
    where: { id },
    data: {
      ...(body.lida !== undefined && {
        lida: body.lida,
        lidaEm: body.lida ? new Date() : null,
      }),
      ...(body.processoId !== undefined && { processoId: body.processoId }),
    },
    include: {
      processo: {
        select: {
          id: true, numeroCnj: true, tipoAcao: true,
          cliente: { select: { id: true, nomeCompleto: true } },
        },
      },
    },
  })

  return NextResponse.json(atualizada)
}
