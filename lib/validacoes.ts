/**
 * Valida o número CNJ no formato NNNNNNN-DD.AAAA.J.TR.OOOO
 * Exemplo válido: 5023262-67.2024.8.13.0145
 */
export function validarNumeroCNJ(numero: string): boolean {
  const regex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/
  return regex.test(numero)
}

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '')
  if (limpo.length !== 11) return false
  if (/^(\d)\1{10}$/.test(limpo)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(limpo[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo[9])) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(limpo[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(limpo[10])
}

/**
 * Gera as iniciais de um nome completo (máximo 2 letras)
 * Ex.: "Maria Clara Silva" → "MC"
 */
export function gerarIniciais(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase()
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase()
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function mascaraCPF(valor: string): string {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/**
 * Aplica máscara de celular: (00) 00000-0000
 */
export function mascaraCelular(valor: string): string {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

/**
 * Aplica máscara de CEP: 00000-000
 */
export function mascaraCEP(valor: string): string {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
}
