import type { Metadata } from "next";
import { EditorialHome } from "@/components/editorial-home/EditorialHome";
import "./editorial-home.css";
import "./infinite-world.css";
import "./settlement.css";

export const metadata: Metadata = {
  alternates: { canonical: "https://ffcap.cn/" },
  title: "非凡资本 UniqueCapital | AI 研究、资本与生态",
  description: "连接 Agentic AI、Physical AI 与 Entertainment AI 的研究、资本与产业生态。",
};

export default function HomePage() {
  return <EditorialHome />;
}
