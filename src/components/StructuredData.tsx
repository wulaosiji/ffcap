import { serializeStructuredData } from '@/content/site-identity.mjs'
export function StructuredData({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}/>
}
