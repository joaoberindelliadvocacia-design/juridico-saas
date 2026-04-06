import { isWeekend, addDays } from 'date-fns'
import { prisma } from './prisma'

/**
 * Calcula quantos dias úteis restam até a data de vencimento.
 * Exclui sábados, domingos e feriados nacionais cadastrados no banco.
 */
export async function calcularDiasUteisRestantes(dataVencimento: Date): Promise<number> {
  const feriados = await prisma.feriado.findMany()
  const datasFeriados = new Set(
    feriados.map((f) => f.data.toISOString().split('T')[0])
  )

  let dias = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  const vencimento = new Date(dataVencimento)
  vencimento.setHours(0, 0, 0, 0)

  if (cursor >= vencimento) return 0

  while (cursor < vencimento) {
    cursor = addDays(cursor, 1)
    const dataStr = cursor.toISOString().split('T')[0]
    if (!isWeekend(cursor) && !datasFeriados.has(dataStr)) {
      dias++
    }
  }

  return dias
}

/**
 * Determina a cor do semafórico com base nos dias úteis restantes.
 * Verde: > 5 dias | Âmbar: 2–5 dias | Vermelho: < 2 dias ou vencido
 */
export function corSemaforo(diasUteis: number): 'verde' | 'ambar' | 'vermelho' {
  if (diasUteis > 5) return 'verde'
  if (diasUteis >= 2) return 'ambar'
  return 'vermelho'
}
