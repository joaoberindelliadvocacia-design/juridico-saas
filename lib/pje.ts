// Cliente da API PJe Comunicações (comunicaapi.pje.jus.br)
// Documentação: https://comunicaapi.pje.jus.br/api/v1/doc

const BASE_URL = process.env.PJE_API_URL || 'https://comunicaapi.pje.jus.br/api/v1'

export interface PjeComunicacao {
  id: string
  dataDisponibilizacao: string
  tipoComunicacao: string
  nomeOrgao?: string
  texto: string
  numeroCnj: string
  link?: string
  meioCompleto?: string
  sigilosidade?: string
}

export interface PjeResponse {
  total: number
  comunicacoes: PjeComunicacao[]
}

export async function buscarComunicacoes({
  numeroOab,
  ufOab,
  pagina = 1,
  porPagina = 20,
  dataInicio,
}: {
  numeroOab: string
  ufOab: string
  pagina?: number
  porPagina?: number
  dataInicio?: string
}): Promise<PjeResponse> {
  const params = new URLSearchParams({
    numeroOab,
    ufOab: ufOab.toUpperCase(),
    paginaAtual: String(pagina),
    quantidadeRegistrosPorPagina: String(porPagina),
    ...(dataInicio && { dataDisponibilizacaoInicio: dataInicio }),
  })

  const res = await fetch(`${BASE_URL}/comunicacao?${params}`, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`PJe API erro ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()

  // Normaliza o formato da resposta (API pode variar)
  return {
    total: data.total ?? data.count ?? 0,
    comunicacoes: (data.comunicacoes ?? data.items ?? data.data ?? []).map((c: any) => ({
      id: String(c.id ?? c.djenId ?? c.comunicacaoId),
      dataDisponibilizacao: c.dataDisponibilizacao ?? c.data ?? new Date().toISOString(),
      tipoComunicacao: c.tipoComunicacao ?? c.tipo ?? 'Intimação',
      nomeOrgao: c.nomeOrgao ?? c.orgao ?? null,
      texto: c.texto ?? c.conteudo ?? c.meioCompleto ?? '',
      numeroCnj: c.numeroCnj ?? c.numeroProcesso ?? '',
      link: c.link ?? c.url ?? null,
      meioCompleto: c.meioCompleto ?? null,
    })),
  }
}
