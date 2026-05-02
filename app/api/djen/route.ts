import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lida = searchParams.get('lida')
  const busca = searchParams.get('busca') ?? ''
  const nomeAdvogado = searchParams.get('nomeAdvogado') ?? ''
  const oabAdvogado = searchParams.get('oabAdvogado') ?? ''
  const periodo = searchParams.get('periodo') ?? '7'

  // Calcular data limite baseada no período
  const diasAtras = parseInt(periodo, 10)
  const dataLimite = subDays(new Date(), diasAtras)

  const publicacoes = await prisma.publicacao.findMany({
    where: {
      // Filtro de status (lida/não lida)
      ...(lida !== null && { lida: lida === 'true' }),

      // Filtro de período
      dataDisponibilizacao: {
        gte: dataLimite,
      },

      // Filtro por nome do advogado
      ...(nomeAdvogado && {
        nomeAdvogado: { contains: nomeAdvogado, mode: 'insensitive' },
      }),

      // Filtro por OAB
      ...(oabAdvogado && {
        oabAdvogado: { contains: oabAdvogado, mode: 'insensitive' },
      }),

      // Busca textual
      ...(busca && {
        OR: [
          { numeroCnj: { contains: busca, mode: 'insensitive' } },
          { tipoComunicacao: { contains: busca, mode: 'insensitive' } },
          { texto: { contains: busca, mode: 'insensitive' } },
          { nomeOrgao: { contains: busca, mode: 'insensitive' } },
          { processo: { cliente: { nomeCompleto: { contains: busca, mode: 'insensitive' } } } },
        ],
      }),

      // Mostrar apenas publicações do usuário logado
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
