'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Newspaper,
  TrendingUp,
  DollarSign,
  Settings,
  Scale,
  CalendarDays,
  Plug,
} from 'lucide-react'

interface SidebarProps {
  badges?: {
    clientes?: number
    processos?: number
    prazosUrgentes?: number
    djenNaoLidas?: number
  }
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users, badgeKey: 'clientes' as const },
  { href: '/processos', label: 'Processos', icon: FileText, badgeKey: 'processos' as const },
  { href: '/prazos', label: 'Prazos', icon: Clock, badgeKey: 'prazosUrgentes' as const, badgeRed: true },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/djen', label: 'DJEN', icon: Newspaper, badgeKey: 'djenNaoLidas' as const },
]

const navItemsBottom = [
  { href: '/leads', label: 'CRM de leads', icon: TrendingUp },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/integracoes', label: 'Integrações', icon: Plug },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar({ badges = {} }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-52 min-h-screen flex flex-col flex-shrink-0" style={{ backgroundColor: '#1a1a2e' }}>
      {/* Logo */}
      <div className="px-4 py-4 border-b" style={{ borderColor: '#2e2e4e' }}>
        <img
          src="/logo.svg"
          alt="João Berindelli Advocacia"
          className="w-full"
          style={{ maxHeight: 72 }}
        />
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, badgeKey, badgeRed }) => {
          const active = isActive(href)
          const count = badgeKey ? badges[badgeKey] : undefined

          return (
            <Link
              key={href}
              href={href}
              style={active ? { backgroundColor: '#8B7536', color: '#fff' } : {}}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition group ${
                active
                  ? ''
                  : 'text-slate-400 hover:text-white'
              }`}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#2e2e4e' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
            >
              <span className="flex items-center gap-2.5">
                <Icon size={16} className="flex-shrink-0" />
                {label}
              </span>
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    badgeRed
                      ? 'bg-red-500 text-white'
                      : active
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}

        <div className="my-3 border-t" style={{ borderColor: '#2e2e4e' }} />

        {navItemsBottom.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={active ? { backgroundColor: '#8B7536', color: '#fff' } : {}}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active ? '' : 'text-slate-400 hover:text-white'
              }`}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#2e2e4e' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Versão */}
      <div className="px-4 py-3 border-t" style={{ borderColor: '#2e2e4e' }}>
        <p className="text-[10px]" style={{ color: '#4a4a6a' }}>MVP v1.0 · Fase 1</p>
      </div>
    </aside>
  )
}
