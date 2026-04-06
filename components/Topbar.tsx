'use client'

import { Bell } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

interface TopbarProps {
  titulo?: string
}

function getSaudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getDataFormatada() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function Topbar({ titulo }: TopbarProps) {
  const { data: session } = useSession()
  const [menuAberto, setMenuAberto] = useState(false)

  const saudacao = getSaudacao()
  const data = getDataFormatada()
  const iniciais = session?.user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? 'A'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Esquerda */}
      <div>
        {titulo ? (
          <h1 className="text-base font-semibold text-gray-800">{titulo}</h1>
        ) : (
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {saudacao}, Doutor.
            </p>
            <p className="text-xs text-gray-500 capitalize">{data}</p>
          </div>
        )}
      </div>

      {/* Direita */}
      <div className="flex items-center gap-3">
        {/* Sino */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <Bell size={18} />
        </button>

        {/* Avatar + menu */}
        <div className="relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center transition"
            style={{ backgroundColor: '#8B7536' }}
          >
            {iniciais}
          </button>

          {menuAberto && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuAberto(false)}
              />
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {session?.user?.name ?? 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session?.user?.email ?? ''}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
