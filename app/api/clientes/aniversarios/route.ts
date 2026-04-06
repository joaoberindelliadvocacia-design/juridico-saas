import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dias = parseInt(searchParams.get('dias') ?? '30')

  const clientes = await prisma.cliente.findMany({
    where: {
      usuarioId: session.user.id,
      lembreteAniversario: true,
      dataNascimento: { not: null },
    },
    select: {
      id: true,
      nomeCompleto: true,
      dataNascimento: true,
      celular: true,
      email: true,
    },
  })

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const proximos = clientes
    .map(c => {
      const nasc = c.dataNascimento!
      let aniversario = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate())
      if (aniversario < hoje) {
        aniversario = new Date(hoje.getFullYear() + 1, nasc.getMonth(), nasc.getDate())
      }
      const diasAte = Math.round((aniversario.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      const idade = aniversario.getFullYear() - nasc.getFullYear()
      return { ...c, dataNascimento: nasc.toISOString(), diasAte, idade, aniversario: aniversario.toISOString() }
    })
    .filter(c => c.diasAte <= dias)
    .sort((a, b) => a.diasAte - b.diasAte)

  return NextResponse.json(proximos)
}
