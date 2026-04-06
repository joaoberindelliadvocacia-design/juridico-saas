import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validarNumeroCNJ } from '@/lib/validacoes'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const processo = await prisma.processo.findFirst({
    where: { id, usuarioId: session.user.id },
    include: {
      cliente: true,
      andamentos: { orderBy: { dataAndamento: 'desc' } },
      prazos: { orderBy: { dataVencimento: 'asc' }, where: { status: 'PENDENTE' } },
      _count: { select: { andamentos: true } },
    },
  })

  if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
  return NextResponse.json(processo)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const processo = await prisma.processo.findFirst({ where: { id, usuarioId: session.user.id } })
  if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

  const body = await req.json()
  const { numeroCnj, tipoAcao, clienteId, status, faseProcessual,
          varaJuizo, comarcaTribunal, dataDistribuicao, valorCausa } = body

  if (!numeroCnj?.trim()) return NextResponse.json({ error: 'Número CNJ é obrigatório' }, { status: 400 })
  const cnjLimpo = numeroCnj.trim()
  if (!validarNumeroCNJ(cnjLimpo)) return NextResponse.json({ error: 'Número CNJ inválido' }, { status: 400 })

  const duplicado = await prisma.processo.findFirst({
    where: { usuarioId: session.user.id, numeroCnj: cnjLimpo, NOT: { id } },
  })
  if (duplicado) return NextResponse.json({ error: 'Número CNJ já cadastrado em outro processo' }, { status: 400 })

  const atualizado = await prisma.processo.update({
    where: { id },
    data: {
      numeroCnj: cnjLimpo,
      tipoAcao,
      clienteId,
      status,
      faseProcessual: faseProcessual || null,
      varaJuizo: varaJuizo?.trim() || null,
      comarcaTribunal: comarcaTribunal?.trim() || null,
      dataDistribuicao: dataDistribuicao ? new Date(dataDistribuicao) : null,
      valorCausa: valorCausa ? parseFloat(valorCausa) : null,
    },
  })

  return NextResponse.json(atualizado)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const processo = await prisma.processo.findFirst({ where: { id, usuarioId: session.user.id } })
  if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

  await prisma.processo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
