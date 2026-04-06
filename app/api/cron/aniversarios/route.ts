import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/email'

function autorizado(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return auth === `Bearer ${secret}`
}

function emailAniversario({
  nomeAdvogado,
  nomeCliente,
  diasAte,
  dataNascimento,
}: {
  nomeAdvogado: string
  nomeCliente: string
  diasAte: number
  dataNascimento: Date
}): string {
  const idade = new Date().getFullYear() - dataNascimento.getFullYear()
  const dataFormatada = dataNascimento.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  const textoUrgencia = diasAte === 0 ? 'HOJE' : diasAte === 1 ? 'amanhã' : `em ${diasAte} dias`
  const corBanner = diasAte === 0 ? '#8B7536' : '#1a1a2e'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1a2e;padding:28px 32px;text-align:center;">
            <div style="border-top:2px solid #8B7536;border-bottom:2px solid #8B7536;padding:12px 0;display:inline-block;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:white;letter-spacing:2px;">JOÃO BERINDELLI</p>
              <p style="margin:4px 0 0;font-size:11px;color:#c9b97a;letter-spacing:3px;">ADVOCACIA</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:${corBanner};padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:15px;font-weight:bold;color:${diasAte === 0 ? '#1a1a2e' : 'white'};">
              🎂 Aniversário ${textoUrgencia.toUpperCase()}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Doutor ${nomeAdvogado},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              ${diasAte === 0
                ? 'Um cliente seu faz aniversário <strong>hoje</strong>. Uma mensagem pode fortalecer muito o relacionamento.'
                : `Um cliente seu faz aniversário <strong>${textoUrgencia}</strong>. Aproveite para enviar uma mensagem especial.`
              }
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border-left:4px solid #8B7536;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0;font-size:22px;font-weight:bold;color:#1e293b;">🎉 ${nomeCliente}</p>
                  <p style="margin:8px 0 0;font-size:14px;color:#64748b;">
                    ${dataFormatada} · ${idade} anos
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
              Acesse o sistema para ver a ficha completa do cliente.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Berindelli Advocacia · Sistema de Gestão Jurídica<br>
              <span style="font-size:11px;">Este e-mail foi enviado automaticamente. Não responda.</span>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const emailDestino = process.env.EMAIL_ADVOGADO
  if (!emailDestino) {
    return NextResponse.json({ ok: false, erro: 'EMAIL_ADVOGADO não configurado' }, { status: 400 })
  }

  const hoje = new Date()
  const hojeMs = hoje.getMonth() * 100 + hoje.getDate() // mm * 100 + dd

  // Busca todos os clientes com lembrete ativo e data de nascimento definida
  const clientes = await prisma.cliente.findMany({
    where: {
      lembreteAniversario: true,
      dataNascimento: { not: null },
    },
    include: {
      usuario: { select: { nome: true } },
    },
  })

  let enviados = 0
  let erros = 0

  for (const cliente of clientes) {
    if (!cliente.dataNascimento) continue

    const nascimento = cliente.dataNascimento
    const aniversarioEsteAno = new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate())

    // Calcula dias até o aniversário (considera virada de ano)
    let diasAte = Math.round((aniversarioEsteAno.getTime() - hoje.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
    if (diasAte < 0) {
      // Aniversário já passou este ano, calcula para o próximo
      const aniversarioProximoAno = new Date(hoje.getFullYear() + 1, nascimento.getMonth(), nascimento.getDate())
      diasAte = Math.round((aniversarioProximoAno.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
    }

    // Envia apenas para aniversários hoje (0), em 3 dias ou em 7 dias
    if (diasAte !== 0 && diasAte !== 3 && diasAte !== 7) continue

    try {
      const html = emailAniversario({
        nomeAdvogado: cliente.usuario?.nome || 'Doutor',
        nomeCliente: cliente.nomeCompleto,
        diasAte,
        dataNascimento: nascimento,
      })

      const assunto = diasAte === 0
        ? `🎂 Aniversário hoje: ${cliente.nomeCompleto}`
        : `🎂 Aniversário em ${diasAte} dias: ${cliente.nomeCompleto}`

      await getResend().emails.send({
        from: 'Berindelli Advocacia <alertas@berindelli.adv.br>',
        to: emailDestino,
        subject: assunto,
        html,
      })

      enviados++
    } catch (err) {
      console.error(`Erro ao enviar lembrete de ${cliente.nomeCompleto}:`, err)
      erros++
    }
  }

  return NextResponse.json({
    ok: true,
    enviados,
    erros,
    executadoEm: new Date().toISOString(),
  })
}
