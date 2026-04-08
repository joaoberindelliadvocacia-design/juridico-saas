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

// Agenda removida — unificada com Prazos (app/agenda/page.tsx redireciona para /prazos)
const navItems = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/clientes',  label: 'Clientes',   icon: Users,    badgeKey: 'clientes'      as const },
  { href: '/processos', label: 'Processos',  icon: FileText, badgeKey: 'processos'     as const },
  { href: '/prazos',    label: 'Prazos',     icon: Clock,    badgeKey: 'prazosUrgentes'as const, badgeRed: true },
  { href: '/djen',      label: 'DJEN',       icon: Newspaper,badgeKey: 'djenNaoLidas'  as const },
]

const navItemsBottom = [
  { href: '/leads',         label: 'CRM de leads',  icon: TrendingUp },
  { href: '/financeiro',    label: 'Financeiro',    icon: DollarSign },
  { href: '/integracoes',   label: 'Integrações',   icon: Plug       },
  { href: '/configuracoes', label: 'Configurações', icon: Settings   },
]

export function Sidebar({ badges = {} }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    // /prazos também fica ativo quando estiver em /agenda (redirect)
    if (href === '/prazos' && pathname.startsWith('/agenda')) return true
    return pathname === href || pathname.startsWith(href + '/')
  }

  const linkBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 500,
    textDecoration: 'none', transition: 'background-color 0.15s',
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
          const count  = badgeKey ? badges[badgeKey] : undefined

          return (
            <Link
              key={href}
              href={href}
              style={{
                ...linkBase,
                backgroundColor: active ? '#8B7536' : 'transparent',
                color: active ? '#fff' : '#94a3b8',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#2e2e4e' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} style={{ flexShrink: 0 }} />
                {label}
              </span>
              {count !== undefined && count > 0 && (
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  padding: '2px 6px', borderRadius: '999px', minWidth: '18px', textAlign: 'center',
                  backgroundColor: badgeRed ? '#ef4444' : active ? '#c9b97a' : '#334155',
                  color: badgeRed || active ? 'white' : '#94a3b8',
                }}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}

        <div style={{ margin: '12px 0', borderTop: '1px solid #2e2e4e' }} />

        {navItemsBottom.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                ...linkBase,
                justifyContent: 'flex-start', gap: '10px',
                backgroundColor: active ? '#8B7536' : 'transparent',
                color: active ? '#fff' : '#94a3b8',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#2e2e4e' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
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
