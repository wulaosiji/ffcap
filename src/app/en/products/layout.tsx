import { EditorialShell } from '@/components/editorial-home/EditorialShell'
import '../../editorial-home.css'
import '../../research/research.css'

export default function EnglishProductsLayout({ children }: { children: React.ReactNode }) {
  return <EditorialShell>{children}</EditorialShell>
}
