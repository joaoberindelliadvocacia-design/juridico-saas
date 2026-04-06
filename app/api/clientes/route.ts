import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validarCPF } from '@/lib/validacoes'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const busca = searchParams.get('busca') ?? ''

  const clientes = await prisma.cliente.findMany({
    where: {
      usuarioId: session.user.id,
      ...(busca
        ? {
            OR: [
              { nomeCompleto: { contains: busca, mode: 'insensitive' } },
              { cpf: { contains: busca } },
              { celular: { contains: busca } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { processos: true } },
    },
    orderBy: { nomeCompleto: 'asc' },
  })

  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { nomeCompleto, cpf, celular, email, dataNascimento, lembreteAniversario,
          cep, logradouro, numero, complemento, bairro, cidade, estado, pais,
          moduloFamilia } = body

  if (!nomeCompleto?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  if (!cpf?.trim()) return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
  if (!celular?.trim()) return NextResponse.json({ error: 'Celular é obrigatório' }, { status: 400 })

  const cpfLimpo = cpf.replace(/\D/g, '')
  if (!validarCPF(cpfLimpo)) return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })

  const existente = await prisma.cliente.findFirst({
    where: { usuarioId: session.user.id, cpf: cpfLimpo },
  })
  if (existente) return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 })

  const cliente = await prisma.cliente.create({
    data: {
      usuarioId: session.user.id,
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

  return NextResponse.json(cliente, { status: 201 })
}
