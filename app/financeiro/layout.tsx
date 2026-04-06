import { AppShell } from '@/components/AppShell'

export default function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  return <AppShell titulo="Financeiro">{children}</AppShell>
}
