import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const processoId = searchParams.get('processoId') ?? ''
  const clienteId = searchParams.get('clienteId') ?? ''

  const honorarios = await prisma.honorario.findMany({
    where: {
      processo: { usuarioId: session.user.id },
      ...(processoId && { processoId }),
      ...(clienteId && { clienteId }),
    },
    include: {
      processo: { select: { id: true, numeroCnj: true, tipoAcao: true } },
      cliente: { select: { id: true, nomeCompleto: true } },
      parcelas: { orderBy: { dataVencimento: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(honorarios.map(h => ({
    ...h,
    valorTotal: h.valorTotal.toString(),
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
    parcelas: h.parcelas.map(p => ({
      ...p,
      valor: p.valor.toString(),
      dataVencimento: p.dataVencimento.toISOString(),
      dataPagamento: p.dataPagamento?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { processoId, clienteId, valorTotal, descricao, parcelas } = body

  if (!processoId) return NextResponse.json({ error: 'Processo é obrigatório' }, { status: 400 })
  if (!clienteId) return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 })
  if (!valorTotal || parseFloat(valorTotal) <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  if (!parcelas?.length) return NextResponse.json({ error: 'Informe ao menos uma parcela' }, { status: 400 })

  const processo = await prisma.processo.findFirst({ where: { id: processoId, usuarioId: session.user.id } })
  if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

  const honorario = await prisma.honorario.create({
    data: {
      processoId,
      clienteId,
      valorTotal: parseFloat(valorTotal),
      descricao: descricao?.trim() || null,
      parcelas: {
        create: parcelas.map((p: any, i: number) => ({
          valor: parseFloat(p.valor),
          dataVencimento: new Date(p.dataVencimento),
          descricao: p.descricao || `Parcela ${i + 1}`,
        })),
      },
    },
    include: {
      processo: { select: { id: true, numeroCnj: true, tipoAcao: true } },
      cliente: { select: { id: true, nomeCompleto: true } },
      parcelas: { orderBy: { dataVencimento: 'asc' } },
    },
  })

  return NextResponse.json({
    ...honorario,
    valorTotal: honorario.valorTotal.toString(),
    createdAt: honorario.createdAt.toISOString(),
    updatedAt: honorario.updatedAt.toISOString(),
    parcelas: honorario.parcelas.map(p => ({
      ...p,
      valor: p.valor.toString(),
      dataVencimento: p.dataVencimento.toISOString(),
      dataPagamento: p.dataPagamento?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  }, { status: 201 })
}
