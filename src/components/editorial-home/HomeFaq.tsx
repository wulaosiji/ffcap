import Link from 'next/link'
import { FAQ_ITEMS } from '@/content/home-public.mjs'

export function HomeFaq() {
  return (
    <section id="faq" className="ed-container ed-section ed-home-faq" aria-labelledby="home-faq-title">
      <div className="ed-section-heading">
        <div>
          <p className="ed-eyebrow">FAQ</p>
          <h2 id="home-faq-title">常见问题</h2>
        </div>
        <Link href="/faq" className="ed-link">
          查看全部 FAQ
          <ArrowRightIcon />
        </Link>
      </div>
      <dl className="ed-home-faq__list">
        {FAQ_ITEMS.slice(0, 6).map(item => (
          <div key={item.question} className="ed-home-faq__item">
            <dt>{item.question}</dt>
            <dd>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
