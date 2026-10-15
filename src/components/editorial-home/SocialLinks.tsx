import { Github, Linkedin, Youtube } from 'lucide-react'
import styles from './SocialLinks.module.css'

function SubstackIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 2h18v2H3zm0 5h18v2H3zm0 5h18v10l-9-5-9 5z" /></svg>
}

function LumaIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <path key={i} d="M12 3v5" transform={`rotate(${i * 30} 12 12)`} />)}</svg>
}

const SOCIAL_LINKS = [
  { label: 'LinkedIn · UniqueCapital', href: 'https://www.linkedin.com/company/uniquecapital', Icon: Linkedin },
  { label: 'Substack · UniqueResearch', href: 'https://uniqueresearch.substack.com/', Icon: SubstackIcon },
  { label: 'YouTube · @deltawu', href: 'https://www.youtube.com/@deltawu/', Icon: Youtube },
  { label: 'GitHub · wulaosiji', href: 'https://github.com/wulaosiji', Icon: Github },
  { label: 'Luma · Unique', href: 'https://luma.com/unique', Icon: LumaIcon },
]

export function SocialLinks({ lang }: { lang: 'zh' | 'en' }) {
  const newTab = lang === 'zh' ? '在新标签页打开' : 'opens in a new tab'
  return <nav className={styles.edSocialLinks} aria-label={lang === 'zh' ? '社交媒体账号' : 'Social media accounts'}>
    {SOCIAL_LINKS.map(({ label, href, Icon }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={`${label} (${newTab})`}>
      <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
    </a>)}
  </nav>
}
