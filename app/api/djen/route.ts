import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lida = searchParams.get('lida')
  const busca = searchParams.get('busca') ?? ''

  const publicacoes = await prisma.publicacao.findMany({
    where: {
      ...(lida !== null && { lida: lida === 'true' }),
      ...(busca && {
        OR: [
          { numeroCnj: { contains: busca, mode: 'insensitive' } },
          { tipoComunicacao: { contains: busca, mode: 'insensitive' } },
          { texto: { contains: busca, mode: 'insensitive' } },
          { nomeOrgao: { contains: busca, mode: 'insensitive' } },
          { processo: { cliente: { nomeCompleto: { contains: busca, mode: 'insensitive' } } } },
        ],
      }),
      // Mostra apenas publicações linkadas a processos do usuário
      // OU sem processo (para não perder nenhuma)
      OR: [
        { processo: { usuarioId: session.user.id } },
        { processoId: null },
      ],
    },
    include: {
      processo: {
        select: {
          id: true,
          numeroCnj: true,
          tipoAcao: true,
          varaJuizo: true,
          cliente: { select: { id: true, nomeCompleto: true } },
        },
      },
    },
    orderBy: [{ lida: 'asc' }, { dataDisponibilizacao: 'desc' }],
  })

  return NextResponse.json(publicacoes)
}
