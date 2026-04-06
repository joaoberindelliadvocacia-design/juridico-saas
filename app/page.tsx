import { redirect } from 'next/navigation'

// Página raiz redireciona para o dashboard (protegido por autenticação na Etapa 2)
export default function Home() {
  redirect('/dashboard')
}
