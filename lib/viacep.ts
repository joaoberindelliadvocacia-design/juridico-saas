interface DadosCEP {
  logradouro: string
  bairro: string
  cidade: string
  estado: string
}

export async function buscarCEP(cep: string): Promise<DadosCEP | null> {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    if (!res.ok) return null

    const data = await res.json()
    if (data.erro) return null

    return {
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      cidade: data.localidade ?? '',
      estado: data.uf ?? '',
    }
  } catch {
    return null
  }
}
