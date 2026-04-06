import { AppShell } from '@/components/AppShell'

export default function DjenLayout({ children }: { children: React.ReactNode }) {
  return <AppShell titulo="DJEN">{children}</AppShell>
}
