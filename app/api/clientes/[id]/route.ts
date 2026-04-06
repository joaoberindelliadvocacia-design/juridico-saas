import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validarCPF } from '@/lib/validacoes'

async function getCliente(id: string, usuarioId: string) {
  return prisma.cliente.findFirst({ where: { id, usuarioId } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cliente = await prisma.cliente.findFirst({
    where: { id, usuarioId: session.user.id },
    include: {
      processos: {
        select: { id: true, numeroCnj: true, tipoAcao: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { processos: true } },
    },
  })

  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  return NextResponse.json(cliente)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cliente = await getCliente(id, session.user.id)
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const body = await req.json()
  const { nomeCompleto, cpf, celular, email, dataNascimento, lembreteAniversario,
          cep, logradouro, numero, complemento, bairro, cidade, estado, pais,
          moduloFamilia } = body

  if (!nomeCompleto?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!cpf?.trim()) return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
  if (!celular?.trim()) return NextResponse.json({ error: 'Celular é obrigatório' }, { status: 400 })

  const cpfLimpo = cpf.replace(/\D/g, '')
  if (!validarCPF(cpfLimpo)) return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })

  const duplicado = await prisma.cliente.findFirst({
    where: { usuarioId: session.user.id, cpf: cpfLimpo, NOT: { id } },
  })
  if (duplicado) return NextResponse.json({ error: 'CPF já cadastrado em outro cliente' }, { status: 400 })

  const atualizado = await prisma.cliente.update({
    where: { id },
    data: {
      nomeCompleto: nomeCompleto.trim(),
      cpf: cpfLimpo,
      celular: celular.replace(/\D/g, ''),
      email: email?.trim() || null,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      lembreteAniversario: lembreteAniversario ?? false,
      cep: cep?.replace(/\D/g, '') || null,
      logradouro: logradouro?.trim() || null,
      numero: numero?.trim() || null,
      complemento: complemento?.trim() || null,
      bairro: bairro?.trim() || null,
      cidade: cidade?.trim() || null,
      estado: estado?.trim() || null,
      pais: pais?.trim() || 'Brasil',
      moduloFamilia: moduloFamilia ?? false,
    },
  })

  return NextResponse.json(atualizado)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cliente = await getCliente(id, session.user.id)
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  await prisma.cliente.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
