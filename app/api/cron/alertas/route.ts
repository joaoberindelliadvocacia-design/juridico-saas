import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResend, emailAlertaPrazo } from '@/lib/email'
import { differenceInCalendarDays } from 'date-fns'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function autorizado(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true // em dev sem secret, permite
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  let alertasEnviados = 0
  let erros = 0

  // Busca prazos pendentes que precisam de alerta (5 ou 7 dias)
  const prazos = await prisma.prazo.findMany({
    where: {
      status: 'PENDENTE',
      OR: [
        { alertaDias5: true, alertaEnviado5: false },
        { alertaDias7: true, alertaEnviado7: false },
      ],
    },
    include: {
      processo: {
        include: {
          usuario: true,
          cliente: { select: { nomeCompleto: true } },
        },
      },
    },
  })

  for (const prazo of prazos) {
    const diasRestantes = differenceInCalendarDays(prazo.dataVencimento, hoje)

    const deveEnviar5 = prazo.alertaDias5 && !prazo.alertaEnviado5 && diasRestantes === 5
    const deveEnviar7 = prazo.alertaDias7 && !prazo.alertaEnviado7 && diasRestantes === 7

    if (!deveEnviar5 && !deveEnviar7) continue

    const usuario = prazo.processo.usuario
    const emailDestino = process.env.EMAIL_ADVOGADO || usuario.email

    const htmlEmail = emailAlertaPrazo({
      nomeAdvogado: usuario.nome,
      descricaoPrazo: prazo.descricao,
      tipoPrazo: prazo.tipoPrazo,
      nomeCliente: prazo.processo.cliente.nomeCompleto,
      numeroCnj: prazo.processo.numeroCnj,
      varaJuizo: prazo.processo.varaJuizo,
      dataVencimento: format(prazo.dataVencimento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      diasRestantes,
    })

    try {
      await getResend().emails.send({
        from: 'Berindelli Advocacia <alertas@berindelli.adv.br>',
        to: emailDestino,
        subject: `⚠️ Prazo em ${diasRestantes} dias: ${prazo.descricao}`,
        html: htmlEmail,
      })

      await prisma.prazo.update({
        where: { id: prazo.id },
        data: {
          ...(deveEnviar5 && { alertaEnviado5: true }),
          ...(deveEnviar7 && { alertaEnviado7: true }),
        },
      })

      alertasEnviados++
    } catch (err) {
      console.error(`Erro ao enviar alerta para prazo ${prazo.id}:`, err)
      erros++
    }
  }

  return NextResponse.json({
    ok: true,
    alertasEnviados,
    erros,
    executadoEm: new Date().toISOString(),
  })
}
