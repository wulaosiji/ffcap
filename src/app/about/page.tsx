import { EditorialAbout } from '@/components/editorial-home/EditorialAbout'
import '../editorial-home.css'
import { StructuredData } from '@/components/StructuredData'
import { breadcrumbs } from '@/content/site-identity.mjs'

export default function AboutPage() {
  return <><StructuredData data={breadcrumbs([{ name: '关于我们', url: '/about' }])}/><EditorialAbout /></>
}
