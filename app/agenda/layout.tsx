import { AppShell } from '@/components/AppShell'

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return <AppShell titulo="Agenda">{children}</AppShell>
}
