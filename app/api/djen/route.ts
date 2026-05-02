import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

function autorizado(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return auth === `Bearer ${secret}`
}

// ─── GET — listar publicações ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lida         = searchParams.get('lida')
  const busca        = searchParams.get('busca') ?? ''
  const nomeAdvogado = searchParams.get('nomeAdvogado') ?? ''
  const oabAdvogado  = searchParams.get('oabAdvogado') ?? ''
  const periodo      = searchParams.get('periodo') ?? '7'

  const diasAtras = parseInt(periodo, 10)
  const dataLimite = subDays(new Date(), diasAtras)

  const publicacoes = await prisma.publicacao.findMany({
    where: {
      ...(lida !== null && { lida: lida === 'true' }),
      dataDisponibilizacao: { gte: dataLimite },
      ...(nomeAdvogado && {
        nomeAdvogado: { contains: nomeAdvogado, mode: 'insensitive' },
      }),
      ...(oabAdvogado && {
        oabAdvogado: { contains: oabAdvogado, mode: 'insensitive' },
      }),
      ...(busca && {
        OR: [
          { numeroCnj:       { contains: busca, mode: 'insensitive' } },
          { tipoComunicacao: { contains: busca, mode: 'insensitive' } },
          { texto:           { contains: busca, mode: 'insensitive' } },
          { nomeOrgao:       { contains: busca, mode: 'insensitive' } },
          { processo: { cliente: { nomeCompleto: { contains: busca, mode: 'insensitive' } } } },
        ],
      }),
      OR: [
        { processo: { usuarioId: session.user.id } },
        { processoId: null },
      ],
    },
    include: {
      processo: {
        select: {
          id: true, numeroCnj: true, tipoAcao: true, varaJuizo: true,
          cliente: { select: { id: true, nomeCompleto: true } },
        },
      },
    },
    orderBy: [{ lida: 'asc' }, { dataDisponibilizacao: 'desc' }],
  })

  return NextResponse.json(publicacoes)
}

// ─── POST — criar publicação via skill/integração ─────────────────────────
// Autenticação: Bearer <CRON_SECRET> no header Authorization
export async function POST(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Campos obrigatórios
    const { djenId, numeroCnj, texto, dataDisponibilizacao } = body
    if (!djenId || !numeroCnj || !texto || !dataDisponibilizacao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: djenId, numeroCnj, texto, dataDisponibilizacao' },
        { status: 400 }
      )
    }

    // Evita duplicatas pelo djenId
    const existente = await prisma.publicacao.findUnique({ where: { djenId } })
    if (existente) {
      return NextResponse.json({ ok: true, duplicata: true, id: existente.id })
    }

    // Tenta vincular ao processo pelo numeroCnj
    const processo = await prisma.processo.findFirst({
      where: { numeroCnj: { contains: numeroCnj.replace(/\D/g, '').slice(0, 7) } },
      select: { id: true },
    })

    const publicacao = await prisma.publicacao.create({
      data: {
        djenId,
        numeroCnj,
        texto,
        dataDisponibilizacao:  new Date(dataDisponibilizacao),
        tipoComunicacao:       body.tipoComunicacao  ?? null,
        nomeOrgao:             body.nomeOrgao        ?? null,
        nomeAdvogado:          body.nomeAdvogado      ?? null,
        oabAdvogado:           body.oabAdvogado       ?? null,
        link:                  body.link              ?? null,
        meioCompleto:          body.meioCompleto      ?? null,
        processoId:            processo?.id           ?? null,
      },
    })

    return NextResponse.json({ ok: true, id: publicacao.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/djen]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
