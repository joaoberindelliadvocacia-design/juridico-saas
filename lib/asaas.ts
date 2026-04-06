// Cliente da API Asaas (produção)
// Documentação: https://docs.asaas.com

const BASE_URL = process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3'

async function asaasRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'access_token': process.env.ASAAS_API_KEY!,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const erro = await res.text()
    throw new Error(`Asaas ${res.status}: ${erro}`)
  }
  return res.json()
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────

export async function criarClienteAsaas({
  nome,
  cpf,
  email,
  celular,
}: {
  nome: string
  cpf: string
  email?: string | null
  celular?: string
}): Promise<{ id: string }> {
  return asaasRequest('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: nome,
      cpfCnpj: cpf.replace(/\D/g, ''),
      email: email ?? undefined,
      mobilePhone: celular?.replace(/\D/g, '') ?? undefined,
    }),
  })
}

export async function buscarClienteAsaasPorCpf(cpf: string): Promise<{ id: string } | null> {
  const cpfLimpo = cpf.replace(/\D/g, '')
  const data = await asaasRequest(`/customers?cpfCnpj=${cpfLimpo}`)
  return data.data?.[0] ?? null
}

// ─── COBRANÇAS ────────────────────────────────────────────────────────────

export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

export interface AsaasCobranca {
  id: string
  status: string
  billingType: string
  value: number
  dueDate: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCodeUrl?: string
  pixCopiaECola?: string
}

export async function criarCobrancaAsaas({
  asaasClienteId,
  valor,
  dataVencimento,
  descricao,
  billingType = 'PIX',
}: {
  asaasClienteId: string
  valor: number
  dataVencimento: string // YYYY-MM-DD
  descricao: string
  billingType?: BillingType
}): Promise<AsaasCobranca> {
  return asaasRequest('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: asaasClienteId,
      billingType,
      value: valor,
      dueDate: dataVencimento,
      description: descricao,
    }),
  })
}

export async function buscarCobranca(asaasId: string): Promise<AsaasCobranca> {
  return asaasRequest(`/payments/${asaasId}`)
}

export async function cancelarCobranca(asaasId: string): Promise<void> {
  await asaasRequest(`/payments/${asaasId}`, { method: 'DELETE' })
}

export async function buscarPixQrCode(asaasId: string): Promise<{ encodedImage: string; payload: string }> {
  return asaasRequest(`/payments/${asaasId}/pixQrCode`)
}

// ─── WEBHOOK (valida payload) ──────────────────────────────────────────────

export interface AsaasWebhookEvent {
  event: string
  payment: {
    id: string
    status: string
    value: number
    paymentDate?: string
    billingType: string
  }
}
