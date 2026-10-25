"use client"

import Link from "next/link"
import { Logo } from "@/components/Logo"
import { homeTexts } from "@/content/homeTexts"
import { useLang } from "@/context/LangContext"
import { LINKS, PRODUCTS, primaryNavItems, productPrimaryHref } from "@/content/editorial.mjs"
import { SITE_LINKS } from "@/components/narrative-home/linkMap.mjs"
import { SocialLinks } from "@/components/editorial-home/SocialLinks"
import { IcpFilingLink } from "@/components/IcpFilingLink"

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
              {PRODUCTS.map(product => {
                const href = productPrimaryHref(product, lang)
                const className = "hover:text-foreground transition-colors"
                return (
                  <li key={product.id}>
                    {href.startsWith("http") ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                        {product.name[lang]}
                      </a>
                    ) : (
                      <Link href={href} className={className}>
                        {product.name[lang]}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{homeTexts[lang].footer.services}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {primaryNavItems(lang).map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{homeTexts[lang].footer.company}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={SITE_LINKS.about} className="hover:text-foreground transition-colors">
                  {homeTexts[lang].footer.about}
                </Link>
              </li>
              <li>
                <Link href={LINKS.contact} className="hover:text-foreground transition-colors">
                  {homeTexts[lang].footer.contact}
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
          <p className="mt-2 text-xs">
            <IcpFilingLink className="hover:text-foreground transition-colors" />
          </p>
        </div>
      </div>
    </footer>
  )
}
