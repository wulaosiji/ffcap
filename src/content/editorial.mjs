import { EVENT_DIRECTORY } from "./editorial.events.mjs";

// Public content verified on 2026-09-05. Each content URL is also its source.
// Store event times with an explicit offset; dates alone are for display.
export const LINKS = Object.freeze({
  report: "https://ffcap.cn/report.html",
  rankingApplication: "https://uniquecapital.feishu.cn/share/base/form/shrcn5cWrPZAThRZgxd5zBf9Cxg",
  events: "https://uniquebloom.cn/",
  uniqueResearch: "https://ffcap.cn/rankings.html",
  uniqueBase: "https://uniquebase.ai/",
  uniqueBloom: "https://ffcap.cn/open.html",
  goodProjects: "https://ffcap.cn/bp.html",
});

export const TOPICS = [
  {
    id: "agentic",
    name: "Agentic AI",
    title: { zh: "让智能体进入业务闭环", en: "Agents in the business loop" },
    description: {
      zh: "关注自主智能体、协作系统与企业 AI 落地，研究如何把技术能力转化为可验证的业务结果。",
      en: "Exploring autonomous agents, collaborative systems, and enterprise deployment through measurable business outcomes.",
    },
    href: "https://uniquebloom.cn/sh2026",
  },
  {
    id: "physical",
    name: "Physical AI",
    title: { zh: "从 AI 硬件到具身智能", en: "From AI hardware to embodied intelligence" },
    description: {
      zh: "关注世界模型、机器人与产业场景，追踪高频任务、稳定交付和全球化商业路径。",
      en: "Tracking world models, robotics, and industrial applications through useful tasks, repeatable delivery, and global markets.",
    },
    href: "https://uniquebloom.cn/szopenday2026",
  },
  {
    id: "entertainment",
    name: "Entertainment AI",
    title: { zh: "从内容生成到全新体验", en: "From generated content to new experiences" },
    description: {
      zh: "关注生成式内容、互动叙事与 AI 原生 IP，研究从创作生产到全球发行与用户消费的完整链路。",
      en: "Researching generative media, interactive storytelling, and AI-native IP across creation, production, distribution, and audience experiences.",
    },
    href: "https://uniquebloom.cn/cd2026",
  },
];

// English pages retain the original event name and copy when the source has no translation.
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
  return {
    ...event, topic, kind: 'event',
    title: { zh: event.title, en: event.title },
    description: { zh: event.summary, en: event.summary },
    location: { zh: event.location, en: event.location },
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
    audience: { zh: "面向 AI 产业关注者", en: "For AI industry explorers" },
    description: {
      zh: "浏览非凡产研公开 AI 榜单，发现值得关注的产品与公司。",
      en: "Explore public AI rankings from UniqueResearch and discover products and companies to follow.",
    },
    action: { zh: "查看 AI 榜单", en: "Explore AI rankings" },
    href: LINKS.uniqueResearch,
  },
  {
    id: "uniquebase",
    name: { zh: "UniqueBase", en: "UniqueBase" },
    audience: { zh: "面向 AI 产业研究者", en: "For AI industry researchers" },
    description: {
      zh: "覆盖各行业、主题与城市的全球 AI 公司与相关实体；每条记录带出处与稳定编码，并提供面向 AI 助手与搜索引擎的机器可读版本。",
      en: "Global AI companies across sectors, themes and cities. Every record carries a source and a stable code, with machine-readable versions for AI assistants and search engines.",
    },
    action: { zh: "进入 UniqueBase", en: "Explore UniqueBase" },
    href: LINKS.uniqueBase,
  },
  {
    id: "uniquebloom",
    name: { zh: "UniqueBloom", en: "UniqueBloom" },
    audience: { zh: "面向活动参与者", en: "For event participants" },
    description: {
      zh: "连接嘉宾内容、现场互动与后续关系，让交流延续到活动之外。",
      en: "Connect speaker content, onsite interaction, and relationships beyond the event.",
    },
    action: { zh: "进入 UniqueBloom", en: "Open UniqueBloom" },
    href: LINKS.uniqueBloom,
  },
  {
    id: "good-projects",
    name: { zh: "有好项目", en: "Good Projects" },
    audience: { zh: "面向认证投资人", en: "For verified investors" },
    description: {
      zh: "浏览 AI 创业项目并进行 BP 对接，建立更有上下文的项目连接。",
      en: "Discover AI startups and connect through their pitch decks.",
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
