import { StructuredData } from '@/components/StructuredData'
import { homeFaqGraph, homeItemListGraph } from '@/content/home-public.mjs'

export function HomeStructuredData() {
  return (
    <>
      <StructuredData data={homeItemListGraph()} />
      <StructuredData data={homeFaqGraph()} />
    </>
  )
}
