'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Calendar, Mail, User, ExternalLink } from 'lucide-react'

interface Usuario {
  id: string
  nome: string
  email: string
  oabNumero?: string | null
  oabUf?: string | null
  googleCalendarConnected: boolean
}

interface Props {
  usuario: Usuario
  googleStatus?: string
}

export default function ConfiguracoesClient({ usuario, googleStatus }: Props) {
  const [desconectando, setDesconectando] = useState(false)
  const [conectado, setConectado] = useState(usuario.googleCalendarConnected)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null)

  useEffect(() => {
    if (googleStatus === 'conectado') {
      setConectado(true)
      setToast({ tipo: 'sucesso', mensagem: 'Google Calendar conectado com sucesso!' })
    } else if (googleStatus === 'erro') {
      setToast({ tipo: 'erro', mensagem: 'Erro ao conectar com o Google. Tente novamente.' })
    } else if (googleStatus === 'sem_token') {
      setToast({ tipo: 'erro', mensagem: 'Não foi possível obter permissão de acesso. Tente novamente.' })
    }
  }, [googleStatus])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function desconectarGoogle() {
    setDesconectando(true)
    const res = await fetch('/api/google/disconnect', { method: 'POST' })
    if (res.ok) {
      setConectado(false)
      setToast({ tipo: 'sucesso', mensagem: 'Google Calendar desconectado.' })
    }
    setDesconectando(false)
  }

  const sectionStyle = {
    backgroundColor: 'white', borderRadius: '12px',
    border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px',
  }
  const labelStyle = {
    fontSize: '11px', fontWeight: 600 as const, color: '#94a3b8',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '4px',
  }

  return (
    <div style={{ padding: '24px', maxWidth: '680px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Configurações</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Gerencie seu perfil e integrações</p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          backgroundColor: toast.tipo === 'sucesso' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${toast.tipo === 'sucesso' ? '#86efac' : '#fca5a5'}`,
        }}>
          {toast.tipo === 'sucesso'
            ? <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
            : <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />}
          <span style={{ fontSize: '14px', color: toast.tipo === 'sucesso' ? '#15803d' : '#dc2626' }}>
            {toast.mensagem}
          </span>
        </div>
      )}

      {/* Perfil */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <User size={18} style={{ color: '#8B7536' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Perfil</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'Nome', value: usuario.nome },
            { label: 'E-mail', value: usuario.email },
            { label: 'OAB', value: usuario.oabNumero ? `${usuario.oabNumero}/${usuario.oabUf}` : 'Não cadastrado' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={labelStyle}>{label}</div>
              <div style={{ fontSize: '14px', color: '#1e293b' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Calendar */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Calendar size={18} style={{ color: '#8B7536' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Google Calendar</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Ícone Google */}
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              📅
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Google Calendar</div>
              <div style={{ fontSize: '12px', marginTop: '2px' }}>
                {conectado ? (
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Conectado — prazos serão criados automaticamente
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Não conectado</span>
                )}
              </div>
            </div>
          </div>

          {conectado ? (
            <button
              onClick={desconectarGoogle}
              disabled={desconectando}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                border: '1px solid #fca5a5', backgroundColor: 'white', color: '#dc2626', cursor: 'pointer',
              }}
            >
              {desconectando ? 'Desconectando...' : 'Desconectar'}
            </button>
          ) : (
            <a
              href="/api/google/authorize"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                backgroundColor: '#1a1a2e', color: 'white', textDecoration: 'none',
              }}
            >
              <ExternalLink size={13} /> Conectar
            </a>
          )}
        </div>

        {!conectado && (
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '12px', lineHeight: '1.5' }}>
            Ao conectar, prazos cadastrados com a opção "Google Calendar" serão criados automaticamente na sua agenda com lembretes automáticos.
          </p>
        )}
      </div>

      {/* E-mail */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Mail size={18} style={{ color: '#8B7536' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Alertas por e-mail</h2>
        </div>
        <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={labelStyle}>E-mail de destino</div>
          <div style={{ fontSize: '14px', color: '#1e293b' }}>{process.env.NEXT_PUBLIC_EMAIL_ADVOGADO || usuario.email}</div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', marginBottom: 0 }}>
            Alertas de prazos são enviados 5 e 7 dias antes do vencimento, automaticamente todo dia às 10h.
          </p>
        </div>
      </div>
    </div>
  )
}
