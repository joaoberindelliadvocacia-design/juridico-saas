import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validarNumeroCNJ } from '@/lib/validacoes'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const busca = searchParams.get('busca') ?? ''
  const status = searchParams.get('status') ?? ''

  const processos = await prisma.processo.findMany({
    where: {
      usuarioId: session.user.id,
      ...(status ? { status: status as any } : {}),
      ...(busca ? {
        OR: [
          { numeroCnj: { contains: busca, mode: 'insensitive' } },
          { cliente: { nomeCompleto: { contains: busca, mode: 'insensitive' } } },
          { varaJuizo: { contains: busca, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      cliente: { select: { id: true, nomeCompleto: true, cpf: true } },
      _count: { select: { andamentos: true, prazos: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(processos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { numeroCnj, tipoAcao, clienteId, status, faseProcessual,
          varaJuizo, comarcaTribunal, dataDistribuicao, valorCausa } = body

  if (!numeroCnj?.trim()) return NextResponse.json({ error: 'Número CNJ é obrigatório' }, { status: 400 })
  if (!tipoAcao) return NextResponse.json({ error: 'Tipo de ação é obrigatório' }, { status: 400 })
  if (!clienteId) return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 })

  const cnjLimpo = numeroCnj.trim()
  if (!validarNumeroCNJ(cnjLimpo)) return NextResponse.json({ error: 'Número CNJ inválido. Formato: NNNNNNN-DD.AAAA.J.TR.OOOO' }, { status: 400 })

  const duplicado = await prisma.processo.findFirst({
    where: { usuarioId: session.user.id, numeroCnj: cnjLimpo },
  })
  if (duplicado) return NextResponse.json({ error: 'Processo com este número CNJ já cadastrado' }, { status: 400 })

  const cliente = await prisma.cliente.findFirst({
    where: { id: clienteId, usuarioId: session.user.id },
  })
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const processo = await prisma.processo.create({
    data: {
      usuarioId: session.user.id,
      clienteId,
      numeroCnj: cnjLimpo,
      tipoAcao,
      status: status ?? 'EM_ANDAMENTO',
      faseProcessual: faseProcessual || null,
      varaJuizo: varaJuizo?.trim() || null,
      comarcaTribunal: comarcaTribunal?.trim() || null,
      dataDistribuicao: dataDistribuicao ? new Date(dataDistribuicao) : null,
      valorCausa: valorCausa ? parseFloat(valorCausa) : null,
    },
  })

  return NextResponse.json(processo, { status: 201 })
}
