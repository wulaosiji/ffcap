import { EditorialShell } from '@/components/editorial-home/EditorialShell'
import '../editorial-home.css'
import './research.css'

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return <EditorialShell>{children}</EditorialShell>
}
