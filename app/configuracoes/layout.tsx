import { AppShell } from '@/components/AppShell'

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell titulo="Configurações">{children}</AppShell>
}
