import { EVENT_DIRECTORY } from "./editorial.events.mjs";
import { eventArticlePath, hasEventArticle } from "./event-articles.mjs";

// Public content verified on 2026-09-05. Each content URL is also its source.
// Store event times with an explicit offset; dates alone are for display.
export const LINKS = Object.freeze({
  /** Primary on-site research library (replaces report.html CTAs). */
  report: "/research",
  rankingsHub: "/research/rankings",
  eventsAwardsHub: "/research/events-awards",
  /** @deprecated alias — use rankingsHub */
  uniqueResearch: "/research/rankings",
  contact: "/contact",
  rankingApplication: "https://uniquecapital.feishu.cn/share/base/form/shrcn5cWrPZAThRZgxd5zBf9Cxg",
  events: "https://uniquebloom.cn/",
  uniqueBaseZh: "https://uniquebase.cn/",
  uniqueBaseEn: "https://uniquebase.ai/",
  /** @deprecated alias — prefer uniqueBaseHref(lang) */
  uniqueBase: "https://uniquebase.cn/",
  uniqueBloom: "https://uniquebloom.cn/",
  goodProjects: "https://ffcap.cn/bp.html",
  /**
   * Unique Research product entry.
   * Use this HTTPS origin for the product. Do not send product CTAs to
   * uniqueresearch.substack.com or the unicaresearch.cn typo.
   */
  uniqueResearchSite: "https://uniqueresearch.cn",
});

export function uniqueBaseHref(lang = "zh") {
  return lang === "en" ? LINKS.uniqueBaseEn : LINKS.uniqueBaseZh;
}

/** On-site advanced description for a matrix product. */
export function productDetailPath(product) {
  const id = typeof product === "string" ? product : product?.id;
  return `/products/${id}`;
}

/**
 * Primary CTA on product cards, search, footer, and /products.
 * All matrix products open the on-site description first.
 * External product sites stay on the secondary “enter the product” CTA.
 */
export function productPrimaryHref(product, lang = "zh") {
  return productDetailPath(product);
}

/**
 * External product entry. Secondary when it differs from the primary CTA.
 * On /products/[slug] this is the “enter the product” link.
 */
export function productExternalHref(product, lang = "zh") {
  if (product?.id === "uniquebase") return uniqueBaseHref(lang);
  return product?.href;
}

/** Site header and menus (exactly seven items). About precedes Contact. */
export function primaryNavItems(lang = "zh") {
  const zh = lang !== "en";
  return [
    { label: zh ? "研究与洞察" : "Research", href: zh ? "/research" : "/en/research" },
    { label: zh ? "数据与榜单" : "Data & Rankings", href: LINKS.rankingsHub },
    { label: zh ? "活动与奖项" : "Events & Awards", href: LINKS.eventsAwardsHub },
    { label: zh ? "产品与服务" : "Products & Services", href: "/products" },
    { label: zh ? "给 AI" : "For AI", href: "/for-ai" },
    { label: zh ? "关于我们" : "About", href: "/about" },
    { label: zh ? "联系我们" : "Contact", href: LINKS.contact },
  ];
}

/** Footer peer columns: site menu (no For AI), then the For AI group. Products is a third column. */
export function footerExploreGroups(lang = "zh") {
  const zh = lang !== "en";
  return {
    site: {
      eyebrow: zh ? "探索" : "EXPLORE",
      items: primaryNavItems(lang).filter((item) => item.href !== "/for-ai"),
    },
    ai: {
      eyebrow: zh ? "给 AI" : "For AI",
      items: [
        { label: zh ? "给 AI" : "For AI", href: "/for-ai" },
        { label: "llms.txt", href: "/llms.txt" },
        { label: "llms-full.txt", href: "/llms-full.txt" },
        { label: zh ? "文章索引" : "Article index", href: "/research/latest.md" },
        { label: "JSON", href: "/research/index.json" },
        { label: zh ? "引用说明" : "Citation", href: "/for-models" },
        { label: zh ? "常见问题" : "FAQ", href: "/faq" },
      ],
    },
  };
}

export const TOPICS = [
  {
    id: "agentic",
    name: "Agentic AI",
    title: { zh: "让智能体进入业务闭环", en: "Agents in the business loop" },
    description: {
      zh: "关注自主智能体、协作系统与企业 AI 落地，研究如何把技术能力转化为可验证的业务结果。",
      en: "Exploring autonomous agents, collaborative systems, and enterprise deployment through measurable business outcomes.",
    },
    href: "/topics/agentic",
  },
  {
    id: "physical",
    name: "Physical AI",
    title: { zh: "从 AI 硬件到具身智能", en: "From AI hardware to embodied intelligence" },
    description: {
      zh: "关注世界模型、机器人与产业场景，追踪高频任务、稳定交付和全球化商业路径。",
      en: "Tracking world models, robotics, and industrial applications through useful tasks, repeatable delivery, and global markets.",
    },
    href: "/topics/physical",
  },
  {
    id: "entertainment",
    name: "Entertainment AI",
    title: { zh: "从内容生成到全新体验", en: "From generated content to new experiences" },
    description: {
      zh: "关注生成式内容、互动叙事与 AI 原生 IP，研究从创作生产到全球发行与用户消费的完整链路。",
      en: "Researching generative media, interactive storytelling, and AI-native IP across creation, production, distribution, and audience experiences.",
    },
    href: "/topics/entertainment",
  },
];

const CJK = /[\u3400-\u9fff]/

/**
 * UniqueBloom Latin subtitle, when the public source actually has one.
 * Mixed or Chinese subtitles are not treated as an English title.
 */
export function latinEventSubtitle(event) {
  const subtitle = String(event?.subtitle ?? "").replace(/^[\u200b\s🚀]+/, "").trim()
  if (!subtitle || CJK.test(subtitle)) return ""
  const latin = subtitle.match(/[A-Za-z]/g)?.length ?? 0
  return latin >= 8 ? subtitle : ""
}

/** Event row meta. English uses the ISO date plus a clock, and keeps the venue name. */
export function eventScheduleLine(event, lang = "zh") {
  const place = event.location?.[lang] || event.location?.zh || ""
  if (lang !== "en") return [place, event.timeText].filter(Boolean).join(" · ")
  const dates = [event.date, event.endDate && event.endDate !== event.date ? event.endDate : ""].filter(Boolean).join("–")
  const clocks = String(event.timeText || "").match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/)
  const clock = clocks ? `${clocks[1]}–${clocks[2]}` : ""
  return [place, [dates, clock].filter(Boolean).join(" · ")].filter(Boolean).join(" · ")
}

// English UI uses a Latin UniqueBloom subtitle as the event title when one exists.
// Otherwise the public event name stays as the proper noun. Do not invent a translation.
// Topic grouping is editorial metadata; event facts come only from UniqueBloom.
export const EVENTS = EVENT_DIRECTORY.map(event => {
  const keywords = `${event.title} ${event.tags.join(' ')}`;
  const topic = /Physical AI|物理 AI|具身智能|机器人|AI硬件/i.test(keywords) ? 'physical'
    : /AI 文娱|泛娱乐|创作者经济/i.test(keywords) ? 'entertainment'
    : /Agent|Enterprise AI|AI 商业|OPC/i.test(keywords) ? 'agentic' : 'all';
  // Parse only an unambiguous clock range; keep other source time text as display copy.
  const clocks = event.timeText.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})$/);
  const startAt = clocks ? `${event.date}T${clocks[1].padStart(5, '0')}:00+08:00` : undefined;
  const endAt = clocks ? `${event.endDate || event.date}T${clocks[2].padStart(5, '0')}:00+08:00` : undefined;
  const bloomHref = event.href;
  const articleHref = hasEventArticle(event.slug) ? eventArticlePath(event.slug) : null;
  return {
    ...event, topic, kind: 'event',
    title: { zh: event.title, en: latinEventSubtitle(event) || event.title },
    description: { zh: event.summary, en: event.summary },
    location: { zh: event.location, en: event.location },
    bloomHref,
    articleHref,
    href: articleHref ?? bloomHref,
    startAt, endAt,
  };
});

export const CONTENT = [
  ...EVENTS,
  {
    id: "unique-awards-2026",
    topic: "all",
    kind: "publication",
    title: {
      zh: "2026 第七届「非凡奖」正式揭晓｜全球 AI 商业创新标杆",
      en: "Announcing the Seventh Unique Awards: AI Business Innovation in 2026",
    },
    description: {
      zh: "非凡产研发布第七届非凡奖结果，记录 AI 商业产品与落地实践。",
      en: "UniqueResearch presents the seventh Unique Awards, documenting AI commercial products and deployment practices.",
    },
    href: "https://k.sina.com.cn/article_5953740931_162dee08306703nkuw.html",
    date: "2026-07-17",
  },
];

export const PRODUCTS = [
  {
    id: "uniqueresearch",
    name: { zh: "UniqueResearch", en: "UniqueResearch" },
    audience: { zh: "微信小程序 · 中国大陆用户为主", en: "WeChat mini program · mainly mainland China" },
    description: {
      zh: "非凡产研微信小程序内的信息查阅工具：问卷与调研填写、研究报告浏览与 AI 榜单检索，帮助在站内快速查找所需信息。主要服务中国大陆用户。",
      en: "An in-WeChat-mini-program lookup tool under UniqueResearch: surveys and questionnaires, research report browsing, and AI rankings discovery. Primarily for users in mainland China.",
    },
    detailExtra: {
      zh: "浏览器端亦可阅读本站非凡产研文章库与榜单精选；小程序将问卷、报告与榜单整合为一体化查阅体验。",
      en: "You can also read the on-site article library and curated rankings in a browser; the mini program bundles surveys, reports, and rankings in one place.",
    },
    action: { zh: "进入 Unique Research", en: "Open Unique Research" },
    href: LINKS.uniqueResearchSite,
  },
  {
    id: "uniquebase",
    name: { zh: "UniqueBase", en: "UniqueBase" },
    audience: { zh: "面向全球研究者", en: "For researchers worldwide" },
    description: {
      zh: "全球可访问的 Web 数据产品：覆盖各行业、主题与城市的 AI 公司与相关实体；每条记录带出处与稳定编码，并提供面向 AI 助手与搜索引擎的机器可读版本。",
      en: "A globally accessible web data product: AI companies and related entities across sectors, themes, and cities. Every record includes a source and stable code, with machine-readable formats for AI assistants and search engines.",
    },
    action: { zh: "进入 UniqueBase", en: "Explore UniqueBase" },
    href: LINKS.uniqueBaseZh,
  },
  {
    id: "uniquebloom",
    name: { zh: "UniqueBloom", en: "UniqueBloom" },
    audience: { zh: "面向全球活动参与者", en: "For event participants worldwide" },
    description: {
      zh: "全球可访问的 Web 活动平台：活动日历、报名与议程、嘉宾内容与后续连接，让交流延续到活动之外。",
      en: "A globally accessible web events platform: calendars, registration, agendas, speaker content, and follow-up—keeping conversations going beyond the venue.",
    },
    action: { zh: "进入 UniqueBloom", en: "Open UniqueBloom" },
    href: LINKS.uniqueBloom,
  },
  {
    id: "good-projects",
    name: { zh: "有好项目", en: "Good Projects" },
    audience: { zh: "面向认证投资人（微信小程序）", en: "For verified investors (WeChat mini program)" },
    description: {
      zh: "认证投资人浏览 AI 创业项目并进行 BP 对接。入口为微信小程序，目前主要面向中国大陆用户；海外或非微信环境可能无法打开。",
      en: "Verified investors browse AI startups and connect via pitch decks. Opens in a WeChat mini program, currently aimed mainly at users in mainland China; overseas or non-WeChat users may be unable to access.",
    },
    action: { zh: "查看项目", en: "Explore projects" },
    href: LINKS.goodProjects,
  },
];

function normalizeSearch(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase().trim();
}

/**
 * Search both languages so changing the interface language never hides a match.
 * @template {{topic: string, title: {zh: string, en: string}, description: {zh: string, en: string}}} T
 * @param {T[]} items
 * @param {string} topic
 * @param {string} query
 * @param {string} lang
 * @returns {T[]}
 */
export function filterContent(items, topic = "all", query = "", lang = "zh") {
  const primary = lang === "en" ? "en" : "zh";
  const secondary = primary === "en" ? "zh" : "en";
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);

  return items.filter((item) => {
    if (topic !== "all" && item.topic !== topic) return false;
    if (!terms.length) return true;

    const researchTopic = TOPICS.find(({ id }) => id === item.topic);
    const searchable = normalizeSearch([
      item.title[primary], item.title[secondary],
      item.description[primary], item.description[secondary],
      item.topic, item.city, item.tags?.join(" "), researchTopic?.name,
      researchTopic?.title[primary], researchTopic?.title[secondary],
    ].join(" "));

    return terms.every((term) => searchable.includes(term));
  });
}

/**
 * @typedef {{ zh: string, en: string }} LocalizedText
 */

/**
 * @template {{ name: LocalizedText, description: LocalizedText, audience: LocalizedText }} T
 * @param {ReadonlyArray<T>} items
 * @param {string} [query]
 * @param {string} [lang]
 * @returns {T[]}
 */
export function filterProducts(items, query = "", lang = "zh") {
  const primary = lang === "en" ? "en" : "zh";
  const secondary = primary === "en" ? "zh" : "en";
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);

  return items.filter((item) => {
    if (!terms.length) return true;
    const searchable = normalizeSearch([
      item.name[primary], item.name[secondary],
      item.description[primary], item.description[secondary],
      item.audience[primary], item.audience[secondary],
    ].join(" "));
    return terms.every((term) => searchable.includes(term));
  });
}

const LEGACY_TOPICS = new Map([
  ["#agentic-ai-100", "agentic"],
  ["#physical-ai-100", "physical"],
  ["#entertainment-ai-100", "entertainment"],
]);

export function legacyTopicFromHash(hash) {
  return LEGACY_TOPICS.get(hash) ?? null;
}

/**
 * Event windows include their start and exclude their end: [startAt, endAt).
 * Date-only events use the full calendar day in Asia/Shanghai (+08:00).
 * Callers supply one explicit clock value for consistent server/client output.
 */
export function eventStatus(item, now) {
  if (now === undefined || now === null) {
    throw new TypeError("eventStatus requires an explicit current time");
  }
  const currentTime = new Date(now).getTime();
  if (!Number.isFinite(currentTime)) throw new RangeError("Invalid current time");
  if (item.kind === "publication") return "publication";

  const dayStart = new Date(`${item.date}T00:00:00+08:00`).getTime();
  const start = item.startAt ? new Date(item.startAt).getTime() : dayStart;
  const lastDay = item.endDate ? new Date(`${item.endDate}T00:00:00+08:00`).getTime() : dayStart;
  const end = item.endAt ? new Date(item.endAt).getTime() : lastDay + 86_400_000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new RangeError("Invalid event time window");
  }
  if (item.status === "ended") return "past";
  if (currentTime < start) return "upcoming";
  if (currentTime >= end) return "past";
  return "live";
}
