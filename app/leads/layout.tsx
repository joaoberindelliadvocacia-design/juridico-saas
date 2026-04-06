import { AppShell } from '@/components/AppShell'

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell titulo="CRM de Leads">{children}</AppShell>
}
