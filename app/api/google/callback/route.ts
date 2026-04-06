import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOAuthClient } from '@/lib/google-calendar'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/configuracoes?google=erro', req.url))
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL('/configuracoes?google=sem_token', req.url))
    }

    await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleCalendarConnected: true,
      },
    })

    return NextResponse.redirect(new URL('/configuracoes?google=conectado', req.url))
  } catch (err) {
    console.error('Erro no callback do Google:', err)
    return NextResponse.redirect(new URL('/configuracoes?google=erro', req.url))
  }
}
