"use client"

import Link from "next/link"
import { Logo } from "@/components/Logo"
import { homeTexts } from "@/content/homeTexts"
import { useLang } from "@/context/LangContext"
import { LINKS } from "@/content/editorial.mjs"
import { SITE_LINKS } from "@/components/narrative-home/linkMap.mjs"
import { SocialLinks } from "@/components/editorial-home/SocialLinks"

export function Footer() {
  const { lang } = useLang()

  return (
    <footer className="border-t bg-muted/50 w-full">
      <div className="container py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Logo size={32} />
            </div>
            <SocialLinks lang={lang} />
          </div>
          <div>
            <h3 className="font-semibold mb-4">{homeTexts[lang].footer.product}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={LINKS.uniqueResearch} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  UniqueResearch
                </a>
              </li>
              <li>
                <a href={SITE_LINKS.uniqueClub} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  UniqueClub
                </a>
              </li>
              <li>
                <a href={SITE_LINKS.uniqueBloom} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  UniqueBloom
                </a>
              </li>
              <li>
                <a href={SITE_LINKS.goodProjects} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  {lang === 'zh' ? '有好项目' : 'Good Projects'}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{homeTexts[lang].footer.services}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={SITE_LINKS.report} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  {lang === 'zh' ? '研究与榜单' : 'Research & Rankings'}
                </a>
              </li>
              <li>
                <Link href="/#ecosystem" className="hover:text-foreground transition-colors">
                  {lang === 'zh' ? '活动与生态' : 'Activities & Ecosystem'}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{homeTexts[lang].footer.company}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={SITE_LINKS.rankingApplication} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  {lang === 'zh' ? '申报 AI 榜单' : 'Apply for AI Rankings'}
                </a>
              </li>
              <li>
                <Link href={SITE_LINKS.about} className="hover:text-foreground transition-colors">
                  {homeTexts[lang].footer.about}
                </Link>
              </li>
              <li>
                <Link href="/about#ecosystem" className="hover:text-foreground transition-colors">
                  {lang === 'zh' ? '合作入口' : 'Collaboration'}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
          <p>{homeTexts[lang].footer.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
