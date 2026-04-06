import { AppShell } from '@/components/AppShell'

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell titulo="Clientes">{children}</AppShell>
}
