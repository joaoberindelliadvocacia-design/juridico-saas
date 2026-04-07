'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ExternalLink, Plug } from 'lucide-react'

interface Props {
  googleConectado: boolean
  asaasConfigurado: boolean
}

export default function IntegracoesClient({ googleConectado, asaasConfigurado }: Props) {
  const [desconectando, setDesconectando] = useState(false)
  const [google, setGoogle] = useState(googleConectado)
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null)

  function showToast(tipo: 'sucesso' | 'erro', msg: string) {
    setToast({ tipo, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function desconectarGoogle() {
    setDesconectando(true)
    const res = await fetch('/api/google/disconnect', { method: 'POST' })
    if (res.ok) { setGoogle(false); showToast('sucesso', 'Google Calendar desconectado.') }
    else showToast('erro', 'Erro ao desconectar.')
    setDesconectando(false)
  }

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    marginBottom: '16px',
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: 600 as const, color: '#94a3b8',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Integrações</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>Conecte ferramentas externas ao sistema</p>
      </div>

      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          backgroundColor: toast.tipo === 'sucesso' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${toast.tipo === 'sucesso' ? '#86efac' : '#fca5a5'}`,
        }}>
          {toast.tipo === 'sucesso'
            ? <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
            : <XCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />}
          <span style={{ fontSize: '14px', color: toast.tipo === 'sucesso' ? '#15803d' : '#dc2626' }}>
            {toast.msg}
          </span>
        </div>
      )}

      {/* Asaas */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
              backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>
              💳
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Asaas</h2>
                {asaasConfigurado ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '20px' }}>
                    <CheckCircle size={10} /> Ativo
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#dc2626', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '20px' }}>
                    <XCircle size={10} /> Não configurado
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px', lineHeight: '1.5' }}>
                Plataforma de cobranças e pagamentos. Permite emitir boletos, PIX e cartão de crédito diretamente pelos honorários dos processos.
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {['Boleto bancário', 'PIX instantâneo', 'Cartão de crédito', 'Confirmação automática'].map(f => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ color: '#8B7536' }}>✓</span> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {!asaasConfigurado && (
            <a
              href="https://www.asaas.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                backgroundColor: '#1a1a2e', color: 'white', textDecoration: 'none',
              }}
            >
              <ExternalLink size={13} /> Criar conta
            </a>
          )}
        </div>
        {!asaasConfigurado && (
          <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
              Para ativar: crie uma conta no Asaas, obtenha a API key e adicione a variável <code style={{ backgroundColor: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>ASAAS_API_KEY</code> nas configurações do Vercel.
            </p>
          </div>
        )}
      </div>

      {/* Google Calendar */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
              backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>
              📅
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Google Calendar</h2>
                {google ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '20px' }}>
                    <CheckCircle size={10} /> Conectado
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>
                    <XCircle size={10} /> Desconectado
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px', lineHeight: '1.5' }}>
                Sincroniza prazos processuais com sua agenda do Google automaticamente, com lembretes configurados.
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {['Criação automática de eventos', 'Lembretes automáticos', 'Sincronização bidirecional'].map(f => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ color: '#8B7536' }}>✓</span> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            {google ? (
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
        </div>
      </div>

      {/* Em breve */}
      <div style={{ ...cardStyle, opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plug size={20} style={{ color: '#94a3b8' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8', margin: 0 }}>Mais integrações</h2>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>
                Em breve
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              WhatsApp Business, e-mail marketing, tribunais e mais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
