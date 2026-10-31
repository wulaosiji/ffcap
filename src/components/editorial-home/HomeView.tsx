import { EditorialHome } from '@/components/editorial-home/EditorialHome'
import { HomeFaq } from '@/components/editorial-home/HomeFaq'
import { HomeStructuredData } from '@/components/editorial-home/HomeStructuredData'
import { ResearchHero } from '@/components/editorial-home/ResearchHero'
import { WorldTeaser } from '@/components/editorial-home/WorldTeaser'
import {
  FAQ_ITEMS,
  FAQ_ITEMS_EN,
  homeLatestAnnouncement,
  homeLatestEnglishAnnouncement,
  homeLibraryCount,
  homeLibraryStatLabel,
} from '@/content/home-public.mjs'

export function HomeView() {
  return (
    <>
      <HomeStructuredData />
      <EditorialHome
        hero={
          <ResearchHero
            announcementZh={homeLatestAnnouncement()}
            announcementEn={homeLatestEnglishAnnouncement()}
            libraryStatZh={homeLibraryStatLabel()}
            libraryCount={homeLibraryCount()}
          />
        }
        tail={
          <>
            <HomeFaq zhItems={FAQ_ITEMS} enItems={FAQ_ITEMS_EN} />
            <WorldTeaser />
          </>
        }
      />
    </>
  )
}
