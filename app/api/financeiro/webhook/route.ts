import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AsaasWebhookEvent } from '@/lib/asaas'

// Webhook do Asaas — confirma pagamentos automaticamente
// Configure em: Minha conta → Integrações → Webhooks
// URL: https://seu-dominio.com/api/financeiro/webhook
export async function POST(req: NextRequest) {
  let body: AsaasWebhookEvent

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { event, payment } = body

  // Eventos que confirmam pagamento
  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const parcela = await prisma.parcela.findFirst({
      where: { asaasId: payment.id },
    })

    if (parcela) {
      await prisma.parcela.update({
        where: { id: parcela.id },
        data: {
          status: 'PAGO',
          dataPagamento: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
        },
      })
    }
  }

  // Pagamento estornado ou cancelado
  if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_DELETED' || event === 'PAYMENT_OVERDUE') {
    const parcela = await prisma.parcela.findFirst({
      where: { asaasId: payment.id },
    })

    if (parcela && event !== 'PAYMENT_OVERDUE') {
      await prisma.parcela.update({
        where: { id: parcela.id },
        data: { status: 'PENDENTE', dataPagamento: null },
      })
    }

    if (parcela && event === 'PAYMENT_OVERDUE') {
      await prisma.parcela.update({
        where: { id: parcela.id },
        data: { status: 'VENCIDO' },
      })
    }
  }

  return NextResponse.json({ received: true })
}
