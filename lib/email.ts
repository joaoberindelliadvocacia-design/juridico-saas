import { Resend } from 'resend'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export function emailAlertaPrazo({
  nomeAdvogado,
  descricaoPrazo,
  tipoPrazo,
  nomeCliente,
  numeroCnj,
  varaJuizo,
  dataVencimento,
  diasRestantes,
}: {
  nomeAdvogado: string
  descricaoPrazo: string
  tipoPrazo: string
  nomeCliente: string
  numeroCnj: string
  varaJuizo?: string | null
  dataVencimento: string
  diasRestantes: number
}): string {
  const corTipo = tipoPrazo === 'FATAL' ? '#ef4444' : '#22c55e'
  const labelTipo = tipoPrazo === 'FATAL' ? 'PRAZO FATAL' : 'PRAZO INTERNO'
  const corUrgencia = diasRestantes <= 2 ? '#ef4444' : diasRestantes <= 5 ? '#f59e0b' : '#22c55e'
  const textoUrgencia = diasRestantes === 0
    ? 'VENCE HOJE'
    : diasRestantes === 1
    ? 'Vence amanhã'
    : `Vence em ${diasRestantes} dias`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#1a1a2e;padding:28px 32px;text-align:center;">
            <div style="border-top:2px solid #8B7536;border-bottom:2px solid #8B7536;padding:12px 0;display:inline-block;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:white;letter-spacing:2px;font-family:Georgia,serif;">JOÃO BERINDELLI</p>
              <p style="margin:4px 0 0;font-size:11px;color:#c9b97a;letter-spacing:3px;">ADVOCACIA</p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:${corUrgencia};padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:15px;font-weight:bold;color:white;letter-spacing:1px;">${textoUrgencia}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Doutor ${nomeAdvogado},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              Você tem um prazo vencendo ${diasRestantes === 0 ? '<strong>hoje</strong>' : diasRestantes === 1 ? '<strong>amanhã</strong>' : `em <strong>${diasRestantes} dias</strong>`}.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border-left:4px solid ${corTipo};overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;">
                    <span style="display:inline-block;background:${corTipo}20;color:${corTipo};font-size:11px;font-weight:bold;padding:3px 10px;border-radius:20px;letter-spacing:1px;">${labelTipo}</span>
                  </p>
                  <p style="margin:8px 0 0;font-size:18px;font-weight:bold;color:#1e293b;">${descricaoPrazo}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${nomeCliente}</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:16px;">
                    <tr>
                      <td width="50%" style="padding:4px 0;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Processo</p>
                        <p style="margin:2px 0 0;font-size:13px;color:#1e293b;font-family:monospace;">${numeroCnj}</p>
                      </td>
                      <td width="50%" style="padding:4px 0;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Vencimento</p>
                        <p style="margin:2px 0 0;font-size:13px;font-weight:bold;color:${corUrgencia};">${dataVencimento}</p>
                      </td>
                    </tr>
                    ${varaJuizo ? `<tr><td colspan="2" style="padding:8px 0 4px;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Vara / Juízo</p>
                      <p style="margin:2px 0 0;font-size:13px;color:#1e293b;">${varaJuizo}</p>
                    </td></tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
              Acesse o sistema para visualizar todos os prazos e tomar as ações necessárias.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Berindelli Advocacia · Sistema de Gestão Jurídica<br>
              <span style="font-size:11px;">Este e-mail foi enviado automaticamente. Não responda.</span>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function emailAlertaDJEN({
  nomeAdvogado,
  numeroCnj,
  tipoComunicacao,
  nomeCliente,
  nomeOrgao,
  trecho,
  dataPublicacao,
}: {
  nomeAdvogado: string
  numeroCnj: string
  tipoComunicacao: string
  nomeCliente: string
  nomeOrgao?: string | null
  trecho?: string | null
  dataPublicacao: string
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1a2e;padding:28px 32px;text-align:center;">
            <div style="border-top:2px solid #8B7536;border-bottom:2px solid #8B7536;padding:12px 0;display:inline-block;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:white;letter-spacing:2px;">JOÃO BERINDELLI</p>
              <p style="margin:4px 0 0;font-size:11px;color:#c9b97a;letter-spacing:3px;">ADVOCACIA</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#3b82f6;padding:14px 32px;text-align:center;">
            <p style="margin:0;font-size:15px;font-weight:bold;color:white;">📋 NOVA PUBLICAÇÃO DJEN</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Doutor ${nomeAdvogado},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              Uma nova publicação foi identificada no DJEN para um de seus processos.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:10px;border-left:4px solid #3b82f6;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0;font-size:16px;font-weight:bold;color:#1e293b;">${tipoComunicacao}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${nomeCliente}</p>
                  ${trecho ? `<p style="margin:12px 0 0;font-size:13px;color:#374151;line-height:1.6;font-style:italic;">"${trecho.slice(0, 300)}${trecho.length > 300 ? '...' : ''}"</p>` : ''}
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:1px solid #bfdbfe;padding-top:16px;">
                    <tr>
                      <td width="50%" style="padding:4px 0;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Processo</p>
                        <p style="margin:2px 0 0;font-size:13px;color:#1e293b;font-family:monospace;">${numeroCnj}</p>
                      </td>
                      <td width="50%" style="padding:4px 0;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Data</p>
                        <p style="margin:2px 0 0;font-size:13px;color:#1e293b;">${dataPublicacao}</p>
                      </td>
                    </tr>
                    ${nomeOrgao ? `<tr><td colspan="2" style="padding:8px 0 4px;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Órgão</p>
                      <p style="margin:2px 0 0;font-size:13px;color:#1e293b;">${nomeOrgao}</p>
                    </td></tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">Acesse o sistema para criar um prazo ou marcar como lida.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">Berindelli Advocacia · Sistema de Gestão Jurídica<br><span style="font-size:11px;">Este e-mail foi enviado automaticamente. Não responda.</span></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
