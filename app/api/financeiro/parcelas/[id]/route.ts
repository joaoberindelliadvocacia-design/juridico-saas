import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  criarClienteAsaas, buscarClienteAsaasPorCpf,
  criarCobrancaAsaas, cancelarCobranca, BillingType,
} from '@/lib/asaas'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const parcela = await prisma.parcela.findFirst({
    where: { id },
    include: {
      honorario: {
        include: {
          processo: { select: { usuarioId: true, numeroCnj: true } },
          cliente: { select: { id: true, nomeCompleto: true, cpf: true, email: true, celular: true, asaasId: true } },
        },
      },
    },
  })
  if (!parcela || parcela.honorario.processo.usuarioId !== session.user.id) {
    return NextResponse.json({ error: 'Parcela não encontrada' }, { status: 404 })
  }

  const body = await req.json()

  // Marcar como pago manualmente
  if (body.status === 'PAGO') {
    const atualizada = await prisma.parcela.update({
      where: { id },
      data: { status: 'PAGO', dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : new Date() },
    })
    return NextResponse.json({ ...atualizada, valor: atualizada.valor.toString(), dataVencimento: atualizada.dataVencimento.toISOString(), dataPagamento: atualizada.dataPagamento?.toISOString() ?? null, createdAt: atualizada.createdAt.toISOString(), updatedAt: atualizada.updatedAt.toISOString() })
  }

  // Desfazer pagamento
  if (body.status === 'PENDENTE') {
    const atualizada = await prisma.parcela.update({
      where: { id },
      data: { status: 'PENDENTE', dataPagamento: null },
    })
    return NextResponse.json({ ...atualizada, valor: atualizada.valor.toString(), dataVencimento: atualizada.dataVencimento.toISOString(), dataPagamento: null, createdAt: atualizada.createdAt.toISOString(), updatedAt: atualizada.updatedAt.toISOString() })
  }

  // Gerar cobrança no Asaas
  if (body.gerarCobranca) {
    const billingType: BillingType = body.billingType || 'PIX'
    const cliente = parcela.honorario.cliente

    try {
      // Garante que o cliente existe no Asaas
      let asaasClienteId = cliente.asaasId
      if (!asaasClienteId) {
        const existente = await buscarClienteAsaasPorCpf(cliente.cpf)
        if (existente) {
          asaasClienteId = existente.id
        } else {
          const novo = await criarClienteAsaas({
            nome: cliente.nomeCompleto,
            cpf: cliente.cpf,
            email: cliente.email,
            celular: cliente.celular,
          })
          asaasClienteId = novo.id
        }
        // Salva o ID do Asaas no cliente
        await prisma.cliente.update({ where: { id: cliente.id }, data: { asaasId: asaasClienteId } })
      }

      const cobranca = await criarCobrancaAsaas({
        asaasClienteId,
        valor: parseFloat(parcela.valor.toString()),
        dataVencimento: parcela.dataVencimento.toISOString().slice(0, 10),
        descricao: parcela.descricao || `Honorários — ${parcela.honorario.processo.numeroCnj}`,
        billingType,
      })

      const atualizada = await prisma.parcela.update({
        where: { id },
        data: {
          asaasId: cobranca.id,
          asaasPayLink: cobranca.invoiceUrl ?? cobranca.bankSlipUrl ?? null,
          asaasBillingType: billingType,
        },
      })

      return NextResponse.json({
        ...atualizada,
        valor: atualizada.valor.toString(),
        dataVencimento: atualizada.dataVencimento.toISOString(),
        dataPagamento: atualizada.dataPagamento?.toISOString() ?? null,
        createdAt: atualizada.createdAt.toISOString(),
        updatedAt: atualizada.updatedAt.toISOString(),
        asaasCobranca: cobranca,
      })
    } catch (err: any) {
      return NextResponse.json({ error: `Erro Asaas: ${err.message}` }, { status: 500 })
    }
  }

  // Cancelar cobrança no Asaas
  if (body.cancelarCobranca && parcela.asaasId) {
    try {
      await cancelarCobranca(parcela.asaasId)
      const atualizada = await prisma.parcela.update({
        where: { id },
        data: { asaasId: null, asaasPayLink: null, asaasBillingType: null },
      })
      return NextResponse.json({ ...atualizada, valor: atualizada.valor.toString(), dataVencimento: atualizada.dataVencimento.toISOString(), dataPagamento: atualizada.dataPagamento?.toISOString() ?? null, createdAt: atualizada.createdAt.toISOString(), updatedAt: atualizada.updatedAt.toISOString() })
    } catch (err: any) {
      return NextResponse.json({ error: `Erro ao cancelar: ${err.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
