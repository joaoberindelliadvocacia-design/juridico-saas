import { google } from 'googleapis'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/google/callback`
  )
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // garante refresh_token mesmo se já autorizou antes
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

export async function getCalendarClient(refreshToken: string) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function criarEventoCalendar({
  refreshToken,
  titulo,
  descricao,
  dataVencimento,
  horario,
}: {
  refreshToken: string
  titulo: string
  descricao: string
  dataVencimento: Date
  horario?: string | null
}): Promise<string | null> {
  try {
    const calendar = await getCalendarClient(refreshToken)

    let start: any
    let end: any

    if (horario) {
      const [hora, min] = horario.split(':').map(Number)
      const inicio = new Date(dataVencimento)
      inicio.setHours(hora, min, 0, 0)
      const fim = new Date(inicio)
      fim.setHours(fim.getHours() + 1)

      start = { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' }
      end = { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' }
    } else {
      const iso = dataVencimento.toISOString().slice(0, 10)
      start = { date: iso }
      end = { date: iso }
    }

    const evento = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `⚖️ ${titulo}`,
        description: descricao,
        start,
        end,
        colorId: '11', // vermelho (Tomato)
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 * 24 * 7 },   // 7 dias antes
            { method: 'email', minutes: 60 * 24 * 5 },   // 5 dias antes
            { method: 'popup', minutes: 60 * 24 },        // 1 dia antes
            { method: 'popup', minutes: 60 },             // 1 hora antes
          ],
        },
      },
    })

    return evento.data.id ?? null
  } catch (err) {
    console.error('Erro ao criar evento no Google Calendar:', err)
    return null
  }
}

export async function deletarEventoCalendar({
  refreshToken,
  googleEventId,
}: {
  refreshToken: string
  googleEventId: string
}): Promise<void> {
  try {
    const calendar = await getCalendarClient(refreshToken)
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId })
  } catch (err) {
    console.error('Erro ao deletar evento do Google Calendar:', err)
  }
}

export async function atualizarEventoCalendar({
  refreshToken,
  googleEventId,
  titulo,
  descricao,
  dataVencimento,
  horario,
}: {
  refreshToken: string
  googleEventId: string
  titulo: string
  descricao: string
  dataVencimento: Date
  horario?: string | null
}): Promise<void> {
  try {
    const calendar = await getCalendarClient(refreshToken)

    let start: any
    let end: any

    if (horario) {
      const [hora, min] = horario.split(':').map(Number)
      const inicio = new Date(dataVencimento)
      inicio.setHours(hora, min, 0, 0)
      const fim = new Date(inicio)
      fim.setHours(fim.getHours() + 1)
      start = { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' }
      end = { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' }
    } else {
      const iso = dataVencimento.toISOString().slice(0, 10)
      start = { date: iso }
      end = { date: iso }
    }

    await calendar.events.update({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: {
        summary: `⚖️ ${titulo}`,
        description: descricao,
        start,
        end,
      },
    })
  } catch (err) {
    console.error('Erro ao atualizar evento do Google Calendar:', err)
  }
}
