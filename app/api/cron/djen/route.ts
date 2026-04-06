import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buscarComunicacoes } from '@/lib/pje'
import { getResend, emailAlertaDJEN } from '@/lib/email'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function autorizado(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const numeroOab = process.env.PJE_NUMERO_OAB
  const ufOab = process.env.PJE_UF_OAB

  if (!numeroOab || !ufOab) {
    return NextResponse.json({
      ok: false,
      erro: 'PJE_NUMERO_OAB e PJE_UF_OAB não configurados no .env',
    }, { status: 400 })
  }

  // Busca a partir de 7 dias atrás para não perder nada
  const dataInicio = new Date()
  dataInicio.setDate(dataInicio.getDate() - 7)
  const dataInicioStr = dataInicio.toISOString().slice(0, 10)

  let novas = 0
  let erros = 0

  try {
    const { comunicacoes } = await buscarComunicacoes({
      numeroOab,
      ufOab,
      pagina: 1,
      porPagina: 50,
      dataInicio: dataInicioStr,
    })

    const emailAdvogado = process.env.EMAIL_ADVOGADO

    for (const com of comunicacoes) {
      // Ignora se já existe
      const jaExiste = await prisma.publicacao.findUnique({
        where: { djenId: com.id },
      })
      if (jaExiste) continue

      // Tenta encontrar o processo pelo CNJ
      const processo = await prisma.processo.findFirst({
        where: { numeroCnj: com.numeroCnj },
        include: { cliente: { select: { nomeCompleto: true } } },
      })

      try {
        await prisma.publicacao.create({
          data: {
            djenId: com.id,
            processoId: processo?.id ?? null,
            dataDisponibilizacao: new Date(com.dataDisponibilizacao),
            tipoComunicacao: com.tipoComunicacao,
            nomeOrgao: com.nomeOrgao ?? null,
            texto: com.texto,
            numeroCnj: com.numeroCnj,
            link: com.link ?? null,
            meioCompleto: com.meioCompleto ?? null,
          },
        })

        novas++

        // Envia e-mail de alerta
        if (emailAdvogado) {
          const nomeAdvogado = process.env.PJE_NOME_ADVOGADO || 'Doutor'
          const html = emailAlertaDJEN({
            nomeAdvogado,
            numeroCnj: com.numeroCnj,
            tipoComunicacao: com.tipoComunicacao,
            nomeCliente: processo?.cliente.nomeCompleto ?? 'Processo não cadastrado',
            nomeOrgao: com.nomeOrgao,
            trecho: com.texto,
            dataPublicacao: format(new Date(com.dataDisponibilizacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          })

          await getResend().emails.send({
            from: 'Berindelli Advocacia <alertas@berindelli.adv.br>',
            to: emailAdvogado,
            subject: `📋 Nova publicação DJEN — ${com.numeroCnj}`,
            html,
          })
        }
      } catch (err) {
        console.error(`Erro ao salvar publicação ${com.id}:`, err)
        erros++
      }
    }
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      erro: err.message ?? 'Erro ao consultar PJe',
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    novas,
    erros,
    executadoEm: new Date().toISOString(),
  })
}
