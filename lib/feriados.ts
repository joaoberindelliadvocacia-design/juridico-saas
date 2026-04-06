// Feriados nacionais fixos (dia/mês) e móveis por ano
// Base: Lei 9.093/95 e feriados proclamados

const FERIADOS_FIXOS = [
  { dia: 1, mes: 1 },   // Confraternização Universal
  { dia: 21, mes: 4 },  // Tiradentes
  { dia: 1, mes: 5 },   // Dia do Trabalho
  { dia: 7, mes: 9 },   // Independência do Brasil
  { dia: 12, mes: 10 }, // Nossa Senhora Aparecida
  { dia: 2, mes: 11 },  // Finados
  { dia: 15, mes: 11 }, // Proclamação da República
  { dia: 20, mes: 11 }, // Consciência Negra (Lei 14.759/2023)
  { dia: 25, mes: 12 }, // Natal
]

// Calcula Páscoa pelo algoritmo de Meeus/Jones/Butcher
function calcularPascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

function addDias(data: Date, dias: number): Date {
  const d = new Date(data)
  d.setDate(d.getDate() + dias)
  return d
}

export function getFeriadosDoAno(ano: number): Set<string> {
  const feriados = new Set<string>()

  // Fixos
  for (const { dia, mes } of FERIADOS_FIXOS) {
    feriados.add(`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`)
  }

  // Móveis baseados na Páscoa
  const pascoa = calcularPascoa(ano)
  const carnaval1 = addDias(pascoa, -48)  // Segunda de Carnaval
  const carnaval2 = addDias(pascoa, -47)  // Terça de Carnaval
  const sextaSanta = addDias(pascoa, -2)  // Sexta-feira Santa
  const corpusChristi = addDias(pascoa, 60)

  for (const d of [carnaval1, carnaval2, sextaSanta, pascoa, corpusChristi]) {
    feriados.add(d.toISOString().slice(0, 10))
  }

  return feriados
}

export function calcularDiasUteis(dataInicio: Date, dataFim: Date): number {
  const inicio = new Date(dataInicio)
  const fim = new Date(dataFim)
  inicio.setHours(0, 0, 0, 0)
  fim.setHours(0, 0, 0, 0)

  if (fim <= inicio) return 0

  // Coleta feriados dos anos envolvidos
  const anos = new Set<number>()
  for (let ano = inicio.getFullYear(); ano <= fim.getFullYear(); ano++) anos.add(ano)
  const feriados = new Set<string>()
  for (const ano of anos) {
    for (const f of getFeriadosDoAno(ano)) feriados.add(f)
  }

  let count = 0
  const cur = new Date(inicio)
  cur.setDate(cur.getDate() + 1) // começa no dia seguinte
  while (cur <= fim) {
    const dow = cur.getDay()
    const iso = cur.toISOString().slice(0, 10)
    if (dow !== 0 && dow !== 6 && !feriados.has(iso)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function isFeriado(data: Date): boolean {
  const feriados = getFeriadosDoAno(data.getFullYear())
  return feriados.has(data.toISOString().slice(0, 10))
}

export function isDiaUtil(data: Date): boolean {
  const dow = data.getDay()
  return dow !== 0 && dow !== 6 && !isFeriado(data)
}
