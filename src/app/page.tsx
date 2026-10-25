import type { Metadata } from "next";
import { EditorialHome } from "@/components/editorial-home/EditorialHome";
import { ResearchHero } from "@/components/editorial-home/ResearchHero";
import { HomeStructuredData } from "@/components/editorial-home/HomeStructuredData";
import { HomeFaq } from "@/components/editorial-home/HomeFaq";
import { WorldTeaser } from "@/components/editorial-home/WorldTeaser";
import { FAQ_ITEMS, FAQ_ITEMS_EN, HOME_META_DESCRIPTION, HOME_OG_IMAGE, HOME_TITLE, homeLatestAnnouncement, homeLatestEnglishAnnouncement, homeLibraryCount, homeLibraryStatLabel } from "@/content/home-public.mjs";
import "./editorial-home.css";

export const metadata: Metadata = {
  alternates: { canonical: "https://ffcap.cn/" },
  title: HOME_TITLE,
  description: HOME_META_DESCRIPTION,
  openGraph: {
    title: HOME_TITLE,
    description: HOME_META_DESCRIPTION,
    url: "https://ffcap.cn/",
    siteName: "非凡资本 UniqueCapital",
    locale: "zh_CN",
    type: "website",
    images: [{ url: HOME_OG_IMAGE, width: 1920, height: 1080, alt: "非凡产研 · 非凡资本" }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_META_DESCRIPTION,
    images: [HOME_OG_IMAGE],
  },
};

export default function HomePage() {
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
  );
}
