import type { Metadata } from "next";
import { HomeView } from "@/components/editorial-home/HomeView";
import { HOME_META_DESCRIPTION, HOME_OG_IMAGE, HOME_TITLE } from "@/content/home-public.mjs";
import "./editorial-home.css";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://ffcap.cn/",
    languages: { "zh-CN": "https://ffcap.cn/", en: "https://ffcap.cn/en" },
  },
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
  return <HomeView />;
}
