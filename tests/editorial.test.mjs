import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { EVENT_SOURCE, EVENT_DIRECTORY } from "../src/content/editorial.events.mjs";
import {
  CONTENT,
  EVENTS,
  LINKS,
  PRODUCTS,
  TOPICS,
  eventStatus,
  filterContent,
  filterProducts,
  legacyTopicFromHash,
  footerExploreGroups,
  primaryNavItems,
  productDetailPath,
  productExternalHref,
  productPrimaryHref,
} from "../src/content/editorial.mjs";

test("editorial content preserves verified public destinations and three research directions", () => {
  assert.deepEqual(TOPICS.map(({ id }) => id), ["agentic", "physical", "entertainment"]);
  assert.ok(EVENT_SOURCE.count > 0);
  assert.equal(EVENTS.length, EVENT_SOURCE.count);
  assert.deepEqual(EVENTS.map(({ id }) => id), EVENT_DIRECTORY.map(({ id }) => id));
  assert.equal(new Set(EVENTS.map(event => event.id)).size, EVENTS.length);
  assert.ok(EVENTS.some(event => event.date.startsWith('2024')));
  assert.ok(EVENTS.some(event => event.status === 'ended'));
  for (const event of EVENTS) {
    assert.equal(new URL(event.bloomHref).origin, 'https://uniquebloom.cn');
    assert.equal(new URL(event.bloomHref).pathname, event.slug ? `/${event.slug}` : `/activities/${event.id}`);
    if (event.articleHref) {
      assert.equal(event.href, event.articleHref);
      assert.match(event.href, /^\/events\//);
    } else {
      assert.equal(event.href, event.bloomHref);
    }
    assert.ok(event.date && event.title.zh && event.location.zh);
  }
  assert.equal(CONTENT.filter(item => item.kind === 'publication').length, 1);
  assert.equal(LINKS.report, "/research");
  assert.equal(LINKS.rankingsHub, "/research/rankings");
  assert.equal(LINKS.eventsAwardsHub, "/research/events-awards");
  assert.deepEqual(primaryNavItems("zh").map(({ label, href }) => ({ label, href })), [
    { label: "研究与洞察", href: "/research" },
    { label: "数据与榜单", href: "/research/rankings" },
    { label: "活动与奖项", href: "/research/events-awards" },
    { label: "产品与服务", href: "/products" },
    { label: "给 AI", href: "/for-ai" },
    { label: "关于我们", href: "/about" },
    { label: "联系我们", href: "/contact" },
  ]);
  assert.deepEqual(primaryNavItems("en").map(({ label, href }) => ({ label, href })), [
    { label: "Research", href: "/en/research" },
    { label: "Data & Rankings", href: "/research/rankings" },
    { label: "Events & Awards", href: "/research/events-awards" },
    { label: "Products & Services", href: "/products" },
    { label: "For AI", href: "/for-ai" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]);
  assert.equal(LINKS.contact, "/contact");
  assert.equal(LINKS.events, "https://uniquebloom.cn/");
  assert.equal(LINKS.rankingApplication, "https://uniquecapital.feishu.cn/share/base/form/shrcn5cWrPZAThRZgxd5zBf9Cxg");
  assert.equal(LINKS.uniqueResearchSite, "https://uniqueresearch.cn");
  assert.deepEqual(PRODUCTS.map(({ href }) => href), [
    "https://uniqueresearch.cn",
    "https://uniquebase.cn/",
    "https://uniquebloom.cn/",
    "https://ffcap.cn/bp.html",
  ]);
  assert.equal(PRODUCTS[0].action.zh, "进入 Unique Research");
  const published = JSON.stringify({ TOPICS, CONTENT, PRODUCTS, LINKS });
  assert.doesNotMatch(published, /flash-fundraising|极速融资|Flash Fundraising/i);
  for (const topic of TOPICS) {
    assert.ok(topic.title.zh && topic.title.en);
    assert.equal(typeof topic.description.zh, "string");
    assert.equal(typeof topic.description.en, "string");
    assert.match(topic.href, /^\/topics\//);
  }
  for (const item of CONTENT) {
    assert.ok(item.title.zh && item.title.en);
    assert.equal(typeof item.description.zh, "string");
    assert.equal(typeof item.description.en, "string");
    if (item.kind === 'event' && item.articleHref) {
      assert.match(item.href, /^\/events\//);
    } else {
      assert.equal(new URL(item.href).protocol, "https:");
    }
  }
});

test("footer explore splits the site menu from the For AI group", () => {
  const zh = footerExploreGroups("zh");
  assert.equal(zh.site.eyebrow, "探索");
  assert.deepEqual(zh.site.items.map(({ label, href }) => ({ label, href })), [
    { label: "研究与洞察", href: "/research" },
    { label: "数据与榜单", href: "/research/rankings" },
    { label: "活动与奖项", href: "/research/events-awards" },
    { label: "产品与服务", href: "/products" },
    { label: "关于我们", href: "/about" },
    { label: "联系我们", href: "/contact" },
  ]);
  assert.equal(zh.ai.eyebrow, "给 AI");
  assert.deepEqual(zh.ai.items.map(({ label, href }) => ({ label, href })), [
    { label: "给 AI", href: "/for-ai" },
    { label: "llms.txt", href: "/llms.txt" },
    { label: "llms-full.txt", href: "/llms-full.txt" },
    { label: "文章索引", href: "/research/latest.md" },
    { label: "JSON", href: "/research/index.json" },
    { label: "引用说明", href: "/for-models" },
    { label: "常见问题", href: "/faq" },
  ]);
  const en = footerExploreGroups("en");
  assert.equal(en.site.eyebrow, "EXPLORE");
  assert.equal(en.ai.eyebrow, "For AI");
  assert.deepEqual(en.site.items.map(({ label }) => label), [
    "Research", "Data & Rankings", "Events & Awards", "Products & Services", "About", "Contact",
  ]);
  assert.equal(en.site.items[0].href, "/en/research");
  assert.deepEqual(en.ai.items.map(({ label, href }) => ({ label, href })), [
    { label: "For AI", href: "/for-ai" },
    { label: "llms.txt", href: "/llms.txt" },
    { label: "llms-full.txt", href: "/llms-full.txt" },
    { label: "Article index", href: "/research/latest.md" },
    { label: "JSON", href: "/research/index.json" },
    { label: "Citation", href: "/for-models" },
    { label: "FAQ", href: "/faq" },
  ]);
});

test("search composes category and bilingual query without mutating the input", () => {
  const fixtures = [
    { id: 'cd', topic: 'entertainment', title: { zh: '成都', en: 'Chengdu' }, description: { zh: '文娱', en: 'Media production' } },
    { id: 'sz', topic: 'physical', title: { zh: '深圳', en: 'Shenzhen' }, description: { zh: '机器人', en: 'Robotics' } },
    { id: 'sh', topic: 'agentic', title: { zh: '上海', en: 'Shanghai' }, description: { zh: '企业智能体', en: 'Enterprise agents' } },
  ];
  const original = JSON.stringify(fixtures);
  assert.deepEqual(filterContent(fixtures), fixtures);
  assert.deepEqual(filterContent(fixtures, 'physical', '   ').map(item => item.id), ['sz']);
  assert.deepEqual(filterContent(fixtures, 'all', '成都', 'en').map(item => item.id), ['cd']);
  assert.deepEqual(filterContent(fixtures, 'all', '  SHANGHAI  ', 'zh').map(item => item.id), ['sh']);
  assert.deepEqual(filterContent(fixtures, 'all', 'Agentic AI').map(item => item.id), ['sh']);
  assert.deepEqual(filterContent(fixtures, 'all', '成都 production').map(item => item.id), ['cd']);
  assert.deepEqual(filterContent(fixtures, 'physical', '成都'), []);
  assert.deepEqual(filterContent(fixtures, 'all', 'a term with no matching content'), []);
  assert.equal(JSON.stringify(fixtures), original);
});

test("event status includes the start and excludes the actual multi-day end", () => {
  const event = { kind: "event", date: "2026-09-17", endDate: "2026-09-18",
    startAt: "2026-09-17T09:00:00+08:00", endAt: "2026-09-18T17:00:00+08:00" };
  assert.equal(eventStatus(event, "2026-09-17T08:59:59+08:00"), "upcoming");
  assert.equal(eventStatus(event, "2026-09-17T09:00:00+08:00"), "live");
  assert.equal(eventStatus(event, "2026-09-18T00:00:00+08:00"), "live");
  assert.equal(eventStatus(event, "2026-09-18T16:59:59+08:00"), "live");
  assert.equal(eventStatus(event, "2026-09-18T17:00:00+08:00"), "past");
  assert.equal(eventStatus(event, "2026-09-18T09:00:00Z"), "past");
});

test("product search matches all normalized terms across bilingual fields", () => {
  const original = JSON.stringify(PRODUCTS);
  assert.deepEqual(filterProducts(PRODUCTS), PRODUCTS);
  assert.deepEqual(filterProducts(PRODUCTS, "  \t "), PRODUCTS);
  assert.deepEqual(filterProducts(PRODUCTS, "UniqueBase companies").map(({ id }) => id), ["uniquebase"]);
  assert.deepEqual(filterProducts(PRODUCTS, "ｕＮＩＱＵＥｂＡＳＥ").map(({ id }) => id), ["uniquebase"]);
  assert.deepEqual(filterProducts(PRODUCTS, "UniqueBase researchers", "en").map(({ id }) => id), ["uniquebase"]);
  assert.deepEqual(filterProducts(PRODUCTS, "认证投资人", "en").map(({ id }) => id), ["good-projects"]);
  assert.deepEqual(filterProducts(PRODUCTS, "event participants", "zh").map(({ id }) => id), ["uniquebloom"]);
  assert.deepEqual(filterProducts(PRODUCTS, "UniqueBase investors"), []);
  assert.equal(JSON.stringify(PRODUCTS), original);
});

test("legacy ranking hashes select the corresponding research topic only", () => {
  assert.equal(legacyTopicFromHash("#agentic-ai-100"), "agentic");
  assert.equal(legacyTopicFromHash("#physical-ai-100"), "physical");
  assert.equal(legacyTopicFromHash("#entertainment-ai-100"), "entertainment");
  for (const hash of ["#research", "#products", "agentic-ai-100", "", undefined, "constructor"]) {
    assert.equal(legacyTopicFromHash(hash), null);
  }
});

test("date-only events use Shanghai midnight boundaries and publications stay publications", () => {
  const event = { kind: "event", date: "2026-09-17" };
  assert.equal(eventStatus(event, "2026-09-16T15:59:59Z"), "upcoming");
  assert.equal(eventStatus(event, "2026-09-16T16:00:00Z"), "live");
  assert.equal(eventStatus(event, "2026-09-17T15:59:59Z"), "live");
  assert.equal(eventStatus(event, "2026-09-17T16:00:00Z"), "past");
  const publication = CONTENT.find(({ kind }) => kind === "publication");
  assert.equal(eventStatus(publication, "2026-09-05T00:00:00+08:00"), "publication");
});

test("event status requires a valid explicit clock and valid event windows", () => {
  const event = CONTENT[0];
  assert.throws(() => eventStatus(event), TypeError);
  assert.throws(() => eventStatus(event, null), TypeError);
  assert.throws(() => eventStatus(event, "not a date"), RangeError);
  assert.throws(() => eventStatus({ ...event, endAt: event.startAt }, "2026-09-05"), RangeError);
  assert.equal(eventStatus(event, new Date("2026-09-05T00:00:00+08:00")), "upcoming");
  assert.equal(eventStatus(CONTENT[1], Date.parse("2026-09-05T00:00:00+08:00")), "past");
});


test("Unique Research product entry is https://uniqueresearch.cn", () => {
  const site = new URL(LINKS.uniqueResearchSite);
  assert.equal(LINKS.uniqueResearchSite, "https://uniqueresearch.cn");
  assert.equal(site.protocol, "https:");
  assert.equal(site.hostname, "uniqueresearch.cn");
  assert.equal(site.pathname, "/");
  assert.doesNotMatch(LINKS.uniqueResearchSite, /unicaresearch|substack/i);
  for (const product of PRODUCTS) {
    assert.equal(new URL(product.href).protocol, "https:");
    assert.doesNotMatch(product.href, /unicaresearch|substack/i);
    assert.doesNotMatch(productExternalHref(product, "zh"), /unicaresearch|substack/i);
    assert.doesNotMatch(productExternalHref(product, "en"), /unicaresearch|substack/i);
  }
  assert.equal(productExternalHref(PRODUCTS[0], "zh"), "https://uniqueresearch.cn");
  assert.equal(productExternalHref(PRODUCTS[0], "en"), "https://uniqueresearch.cn");
});

test("product card CTAs open on-site descriptions before external product sites", () => {
  assert.equal(primaryNavItems("zh").length, 7);
  assert.equal(primaryNavItems("zh")[5].href, "/about");
  assert.equal(primaryNavItems("zh")[6].href, "/contact");
  assert.deepEqual(PRODUCTS.map(product => ({
    id: product.id,
    detail: productDetailPath(product),
    primaryZh: productPrimaryHref(product, "zh"),
    primaryEn: productPrimaryHref(product, "en"),
    externalZh: productExternalHref(product, "zh"),
    externalEn: productExternalHref(product, "en"),
  })), [
    {
      id: "uniqueresearch",
      detail: "/products/uniqueresearch",
      primaryZh: "/products/uniqueresearch",
      primaryEn: "/products/uniqueresearch",
      externalZh: "https://uniqueresearch.cn",
      externalEn: "https://uniqueresearch.cn",
    },
    {
      id: "uniquebase",
      detail: "/products/uniquebase",
      primaryZh: "https://uniquebase.cn/",
      primaryEn: "https://uniquebase.ai/",
      externalZh: "https://uniquebase.cn/",
      externalEn: "https://uniquebase.ai/",
    },
    {
      id: "uniquebloom",
      detail: "/products/uniquebloom",
      primaryZh: "/products/uniquebloom",
      primaryEn: "/products/uniquebloom",
      externalZh: "https://uniquebloom.cn/",
      externalEn: "https://uniquebloom.cn/",
    },
    {
      id: "good-projects",
      detail: "/products/good-projects",
      primaryZh: "/products/good-projects",
      primaryEn: "/products/good-projects",
      externalZh: "https://ffcap.cn/bp.html",
      externalEn: "https://ffcap.cn/bp.html",
    },
  ]);
});

test("editorial product surfaces use the shared primary CTA", async () => {
  const files = await Promise.all([
    ["home", "../src/components/editorial-home/EditorialHome.tsx"],
    ["about", "../src/components/editorial-home/EditorialAbout.tsx"],
    ["shell", "../src/components/editorial-home/EditorialShell.tsx"],
    ["hub", "../src/app/(knowledge)/products/page.tsx"],
    ["detail", "../src/app/(knowledge)/products/[slug]/page.tsx"],
    ["footer", "../src/components/Footer.tsx"],
  ].map(async ([name, file]) => [name, await readFile(new URL(file, import.meta.url), "utf8")]));
  const source = Object.fromEntries(files);
  for (const name of ["home", "about", "shell", "hub", "footer"]) {
    assert.match(source[name], /productPrimaryHref/, name);
    assert.doesNotMatch(source[name], /unicaresearch/i, name);
  }
  assert.match(source.detail, /productExternalHref/);
  assert.doesNotMatch(source.home, /uniqueresearch\.substack/);
  assert.doesNotMatch(source.hub, /href=\{product\.href\}/);
  assert.doesNotMatch(source.shell, /href=\{p\.href\}/);
  assert.match(source.detail, /https:\/\/uniqueresearch\.cn|productExternalHref/);
});

test('source end dates are inclusive and ended activities remain archived', () => {
  const event = { kind: 'event', date: '2026-03-24', endDate: '2026-03-29' };
  assert.equal(eventStatus(event, '2026-03-29T23:59:59+08:00'), 'live');
  assert.equal(eventStatus(event, '2026-03-30T00:00:00+08:00'), 'past');
  assert.equal(eventStatus({ ...event, status: 'ended' }, '2026-03-24T12:00:00+08:00'), 'past');
});
