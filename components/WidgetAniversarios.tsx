'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Gift } from 'lucide-react'

interface ClienteAniversario {
  id: string
  nomeCompleto: string
  dataNascimento: string
  diasAte: number
  idade: number
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function WidgetAniversarios() {
  const [clientes, setClientes] = useState<ClienteAniversario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clientes/aniversarios?dias=30')
      .then(r => r.json())
      .then(data => { setClientes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null
  if (clientes.length === 0) return null

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gift size={18} style={{ color: '#8B7536' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aniversários — próximos 30 dias
          </h3>
        </div>
        <span style={{
          backgroundColor: '#8B7536', color: 'white', fontSize: '11px', fontWeight: 700,
          padding: '2px 8px', borderRadius: '999px',
        }}>{clientes.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {clientes.map(c => {
          const isHoje = c.diasAte === 0
          const isProximo = c.diasAte <= 3

          return (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                borderRadius: '8px', border: `1px solid ${isHoje ? '#8B7536' : '#f1f5f9'}`,
                backgroundColor: isHoje ? '#f0ead6' : '#f8fafc',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = isHoje ? '#e8dfc8' : '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = isHoje ? '#f0ead6' : '#f8fafc')}
              >
                {/* Avatar */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: isHoje ? '#8B7536' : '#1a1a2e', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                }}>
                  {isHoje ? '🎂' : getInitials(c.nomeCompleto)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.nomeCompleto}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                    {new Date(c.dataNascimento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} · {c.idade} anos
                  </div>
                </div>

                {/* Badge dias */}
                <div style={{
                  padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                  backgroundColor: isHoje ? '#8B7536' : isProximo ? '#fef9c3' : '#f1f5f9',
                  color: isHoje ? 'white' : isProximo ? '#854d0e' : '#64748b',
                }}>
                  {isHoje ? 'Hoje!' : c.diasAte === 1 ? 'Amanhã' : `${c.diasAte}d`}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
