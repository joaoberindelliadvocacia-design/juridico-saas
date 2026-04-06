import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { differenceInCalendarDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const uid = session.user.id
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [
    totalClientes,
    totalProcessosAtivos,
    totalProcessosSuspensos,
    totalProcessosEncerrados,
    djenNaoLidas,
    prazosProximos,
    processosRecentes,
    andamentosRecentes,
    processosPorTipo,
  ] = await Promise.all([
    // 1. Total de clientes
    prisma.cliente.count({ where: { usuarioId: uid } }),

    // 2. Processos por status
    prisma.processo.count({ where: { usuarioId: uid, status: 'EM_ANDAMENTO' } }),
    prisma.processo.count({ where: { usuarioId: uid, status: 'SUSPENSO' } }),
    prisma.processo.count({ where: { usuarioId: uid, status: 'ENCERRADO' } }),

    // 3. DJEN não lidas
    prisma.publicacao.count({
      where: { processo: { usuarioId: uid }, lida: false },
    }),

    // 4. Próximos 10 prazos pendentes
    prisma.prazo.findMany({
      where: {
        processo: { usuarioId: uid },
        status: 'PENDENTE',
        dataVencimento: { gte: new Date(hoje.getTime() - 24 * 60 * 60 * 1000) }, // inclui ontem vencidos
      },
      orderBy: { dataVencimento: 'asc' },
      take: 8,
      include: {
        processo: {
          select: {
            id: true, numeroCnj: true,
            cliente: { select: { nomeCompleto: true } },
          },
        },
      },
    }),

    // 5. Processos recém atualizados
    prisma.processo.findMany({
      where: { usuarioId: uid },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        cliente: { select: { nomeCompleto: true } },
        _count: { select: { andamentos: true } },
      },
    }),

    // 6. Últimos andamentos
    prisma.andamento.findMany({
      where: { processo: { usuarioId: uid } },
      orderBy: { dataAndamento: 'desc' },
      take: 5,
      include: {
        processo: {
          select: {
            id: true, numeroCnj: true,
            cliente: { select: { nomeCompleto: true } },
          },
        },
      },
    }),

    // 7. Processos por tipo de ação (para gráfico)
    prisma.processo.groupBy({
      by: ['tipoAcao'],
      where: { usuarioId: uid, status: 'EM_ANDAMENTO' },
      _count: true,
      orderBy: { _count: { tipoAcao: 'desc' } },
    }),
  ])

  // Prazos vencidos (para métrica separada)
  const prazosVencidos = prazosProximos.filter(p =>
    differenceInCalendarDays(p.dataVencimento, hoje) < 0
  ).length
  const prazosUrgentes = prazosProximos.filter(p => {
    const d = differenceInCalendarDays(p.dataVencimento, hoje)
    return d >= 0 && d <= 2
  }).length

  return NextResponse.json({
    metricas: {
      totalClientes,
      totalProcessosAtivos,
      totalProcessosSuspensos,
      totalProcessosEncerrados,
      djenNaoLidas,
      prazosVencidos,
      prazosUrgentes,
    },
    prazosProximos: prazosProximos.map(p => ({
      ...p,
      dataVencimento: p.dataVencimento.toISOString(),
      cumpridoEm: p.cumpridoEm?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    processosRecentes: processosRecentes.map(p => ({
      ...p,
      dataDistribuicao: p.dataDistribuicao?.toISOString() ?? null,
      valorCausa: p.valorCausa?.toString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    andamentosRecentes: andamentosRecentes.map(a => ({
      ...a,
      dataAndamento: a.dataAndamento.toISOString(),
      createdAt: a.createdAt.toISOString(),
    })),
    processosPorTipo,
  })
}
