import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const feriados2026 = [
  { data: new Date('2026-01-01T12:00:00Z'), nome: 'Confraternização Universal' },
  { data: new Date('2026-02-16T12:00:00Z'), nome: 'Carnaval (Segunda-feira)' },
  { data: new Date('2026-02-17T12:00:00Z'), nome: 'Carnaval (Terça-feira)' },
  { data: new Date('2026-04-03T12:00:00Z'), nome: 'Sexta-feira Santa' },
  { data: new Date('2026-04-21T12:00:00Z'), nome: 'Tiradentes' },
  { data: new Date('2026-05-01T12:00:00Z'), nome: 'Dia do Trabalho' },
  { data: new Date('2026-06-04T12:00:00Z'), nome: 'Corpus Christi' },
  { data: new Date('2026-09-07T12:00:00Z'), nome: 'Independência do Brasil' },
  { data: new Date('2026-10-12T12:00:00Z'), nome: 'Nossa Senhora Aparecida' },
  { data: new Date('2026-11-02T12:00:00Z'), nome: 'Finados' },
  { data: new Date('2026-11-15T12:00:00Z'), nome: 'Proclamação da República' },
  { data: new Date('2026-11-20T12:00:00Z'), nome: 'Consciência Negra' },
  { data: new Date('2026-12-25T12:00:00Z'), nome: 'Natal' },
]

async function main() {
  console.log('🌱 Iniciando seed...')

  // Seed feriados 2026
  for (const feriado of feriados2026) {
    await prisma.feriado.upsert({
      where: { data: feriado.data },
      update: { nome: feriado.nome },
      create: { data: feriado.data, nome: feriado.nome, tipo: 'NACIONAL' },
    })
  }
  console.log(`✅ ${feriados2026.length} feriados nacionais de 2026 cadastrados`)

  // Criar usuário administrador padrão (altere a senha após o primeiro login)
  const senhaHash = await bcrypt.hash('mudar@123', 12)
  const usuario = await prisma.usuario.upsert({
    where: { email: 'admin@escritorio.com' },
    update: {},
    create: {
      nome: 'Advogado',
      email: 'admin@escritorio.com',
      senhaHash,
      nomeCompleto: process.env.PJE_NOME_ADVOGADO ?? '',
      oabNumero: process.env.PJE_NUMERO_OAB ?? '',
      oabUf: process.env.PJE_UF_OAB ?? '',
    },
  })
  console.log(`✅ Usuário administrador criado: ${usuario.email}`)
  console.log('   Senha padrão: mudar@123  ← ALTERE APÓS O PRIMEIRO LOGIN')

  console.log('\n🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
