import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { criarEventoCalendar } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') ?? ''
  const status = searchParams.get('status') ?? ''
  const processoId = searchParams.get('processoId') ?? ''
  const mes = searchParams.get('mes') ?? ''
  const ano = searchParams.get('ano') ?? ''

  const where: any = {
    processo: { usuarioId: session.user.id },
  }
  if (tipo) where.tipoPrazo = tipo
  if (status) where.status = status
  if (processoId) where.processoId = processoId
  if (mes && ano) {
    const inicio = new Date(parseInt(ano), parseInt(mes) - 1, 1)
    const fim = new Date(parseInt(ano), parseInt(mes), 0, 23, 59, 59)
    where.dataVencimento = { gte: inicio, lte: fim }
  }

  const prazos = await prisma.prazo.findMany({
    where,
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
    orderBy: [{ status: 'asc' }, { dataVencimento: 'asc' }],
  })

  return NextResponse.json(prazos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { processoId, descricao, tipoPrazo, dataVencimento, horario,
          alertaDias5, alertaDias7, googleCalendar, observacoes } = body

  if (!processoId) return NextResponse.json({ error: 'Processo é obrigatório' }, { status: 400 })
  if (!descricao?.trim()) return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
  if (!tipoPrazo) return NextResponse.json({ error: 'Tipo do prazo é obrigatório' }, { status: 400 })
  if (!dataVencimento) return NextResponse.json({ error: 'Data de vencimento é obrigatória' }, { status: 400 })

  const processo = await prisma.processo.findFirst({
    where: { id: processoId, usuarioId: session.user.id },
    include: { cliente: { select: { nomeCompleto: true } } },
  })
  if (!processo) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

  const prazo = await prisma.prazo.create({
    data: {
      processoId,
      descricao: descricao.trim(),
      tipoPrazo,
      dataVencimento: new Date(dataVencimento),
      horario: horario || null,
      alertaDias5: alertaDias5 !== false,
      alertaDias7: alertaDias7 !== false,
      googleCalendar: googleCalendar === true,
      observacoes: observacoes?.trim() || null,
    },
    include: {
      processo: {
        select: {
          id: true, numeroCnj: true, tipoAcao: true, varaJuizo: true,
          cliente: { select: { id: true, nomeCompleto: true } },
        },
      },
    },
  })

  // Cria evento no Google Calendar se solicitado
  if (googleCalendar) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { googleRefreshToken: true, googleCalendarConnected: true },
    })

    if (usuario?.googleCalendarConnected && usuario.googleRefreshToken) {
      const googleEventId = await criarEventoCalendar({
        refreshToken: usuario.googleRefreshToken,
        titulo: descricao.trim(),
        descricao: `Processo: ${processo.numeroCnj}\nCliente: ${processo.cliente.nomeCompleto}\nTipo: ${tipoPrazo}`,
        dataVencimento: new Date(dataVencimento),
        horario: horario || null,
      })

      if (googleEventId) {
        await prisma.prazo.update({
          where: { id: prazo.id },
          data: { googleEventId },
        })
        return NextResponse.json({ ...prazo, googleEventId }, { status: 201 })
      }
    }
  }

  return NextResponse.json(prazo, { status: 201 })
}
