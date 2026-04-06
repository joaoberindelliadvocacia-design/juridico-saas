import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const etapa = searchParams.get('etapa') ?? ''
  const busca = searchParams.get('busca') ?? ''

  const leads = await prisma.lead.findMany({
    where: {
      usuarioId: session.user.id,
      ...(etapa && { etapa: etapa as any }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { observacoes: { contains: busca, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      cliente: { select: { id: true, nomeCompleto: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(leads.map(l => ({
    ...l,
    convertidoEm: l.convertidoEm?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nome, origem, tipoDemanda, etapa, observacoes } = body

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!origem) return NextResponse.json({ error: 'Origem é obrigatória' }, { status: 400 })
  if (!tipoDemanda) return NextResponse.json({ error: 'Tipo de demanda é obrigatório' }, { status: 400 })

  const lead = await prisma.lead.create({
    data: {
      usuarioId: session.user.id,
      nome: nome.trim(),
      origem,
      tipoDemanda,
      etapa: etapa || 'NOVO_CONTATO',
      observacoes: observacoes?.trim() || null,
    },
  })

  return NextResponse.json({ ...lead, convertidoEm: null, createdAt: lead.createdAt.toISOString(), updatedAt: lead.updatedAt.toISOString() }, { status: 201 })
}
