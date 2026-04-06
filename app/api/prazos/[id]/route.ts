import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deletarEventoCalendar, atualizarEventoCalendar } from '@/lib/google-calendar'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const prazo = await prisma.prazo.findFirst({
    where: { id, processo: { usuarioId: session.user.id } },
  })
  if (!prazo) return NextResponse.json({ error: 'Prazo não encontrado' }, { status: 404 })

  const body = await req.json()

  const atualizado = await prisma.prazo.update({
    where: { id },
    data: {
      ...(body.status !== undefined && {
        status: body.status,
        cumpridoEm: body.status === 'CUMPRIDO' ? new Date() : null,
      }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.tipoPrazo !== undefined && { tipoPrazo: body.tipoPrazo }),
      ...(body.dataVencimento !== undefined && { dataVencimento: new Date(body.dataVencimento) }),
      ...(body.horario !== undefined && { horario: body.horario }),
      ...(body.alertaDias5 !== undefined && { alertaDias5: body.alertaDias5 }),
      ...(body.alertaDias7 !== undefined && { alertaDias7: body.alertaDias7 }),
      ...(body.googleCalendar !== undefined && { googleCalendar: body.googleCalendar }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
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

  // Sincroniza com Google Calendar se tiver evento criado
  if (prazo.googleEventId && (body.descricao !== undefined || body.dataVencimento !== undefined || body.horario !== undefined)) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { googleRefreshToken: true, googleCalendarConnected: true },
    })

    if (usuario?.googleCalendarConnected && usuario.googleRefreshToken) {
      await atualizarEventoCalendar({
        refreshToken: usuario.googleRefreshToken,
        googleEventId: prazo.googleEventId,
        titulo: atualizado.descricao,
        descricao: `Processo: ${atualizado.processo.numeroCnj}\nCliente: ${atualizado.processo.cliente.nomeCompleto}`,
        dataVencimento: atualizado.dataVencimento,
        horario: atualizado.horario,
      })
    }
  }

  return NextResponse.json(atualizado)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const prazo = await prisma.prazo.findFirst({
    where: { id, processo: { usuarioId: session.user.id } },
  })
  if (!prazo) return NextResponse.json({ error: 'Prazo não encontrado' }, { status: 404 })

  // Remove do Google Calendar se existir
  if (prazo.googleEventId) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { googleRefreshToken: true, googleCalendarConnected: true },
    })

    if (usuario?.googleCalendarConnected && usuario.googleRefreshToken) {
      await deletarEventoCalendar({
        refreshToken: usuario.googleRefreshToken,
        googleEventId: prazo.googleEventId,
      })
    }
  }

  await prisma.prazo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
