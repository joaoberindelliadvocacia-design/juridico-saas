import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const lead = await prisma.lead.findFirst({ where: { id, usuarioId: session.user.id } })
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

  const body = await req.json()

  const atualizado = await prisma.lead.update({
    where: { id },
    data: {
      ...(body.etapa !== undefined && { etapa: body.etapa }),
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
      ...(body.origem !== undefined && { origem: body.origem }),
      ...(body.tipoDemanda !== undefined && { tipoDemanda: body.tipoDemanda }),
    },
  })

  return NextResponse.json({ ...atualizado, convertidoEm: atualizado.convertidoEm?.toISOString() ?? null, createdAt: atualizado.createdAt.toISOString(), updatedAt: atualizado.updatedAt.toISOString() })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const lead = await prisma.lead.findFirst({ where: { id, usuarioId: session.user.id } })
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

  await prisma.lead.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
