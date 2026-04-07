'use client'

import { Bell, Moon, Sun } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'

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
  const { dark, toggle } = useTheme()

  const saudacao = getSaudacao()
  const data = getDataFormatada()
  const iniciais = session?.user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? 'A'

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
      {/* Esquerda */}
      <div>
        {titulo ? (
          <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">{titulo}</h1>
        ) : (
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {saudacao}, Doutor.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{data}</p>
          </div>
        )}
      </div>

      {/* Direita */}
      <div className="flex items-center gap-3">
        {/* Toggle dark mode */}
        <button
          onClick={toggle}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400"
          title={dark ? 'Modo claro' : 'Modo escuro'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Sino */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400">
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
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                    {session?.user?.name ?? 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {session?.user?.email ?? ''}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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
