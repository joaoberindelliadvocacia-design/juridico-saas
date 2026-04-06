import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const processo = await prisma.processo.findFirst({ where: { id, usuarioId: session.user.id } })
  if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

  const body = await req.json()
  const { descricao, tipo, dataAndamento } = body

  if (!descricao?.trim()) return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })

  const andamento = await prisma.andamento.create({
    data: {
      processoId: id,
      descricao: descricao.trim(),
      tipo: tipo || null,
      dataAndamento: dataAndamento ? new Date(dataAndamento) : new Date(),
      origem: 'MANUAL',
    },
  })

  return NextResponse.json(andamento, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const processo = await prisma.processo.findFirst({ where: { id, usuarioId: session.user.id } })
  if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

  const andamentos = await prisma.andamento.findMany({
    where: { processoId: id },
    orderBy: { dataAndamento: 'desc' },
  })

  return NextResponse.json(andamentos)
}
