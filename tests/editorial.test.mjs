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
  productsHubPath,
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
    { label: "Data & Rankings", href: "/en/research/rankings" },
    { label: "Events & Awards", href: "/en/research/events-awards" },
    { label: "Products & Services", href: "/en/products" },
    { label: "For AI", href: "/for-ai" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]);
  assert.equal(LINKS.contact, "/contact");
  assert.equal(LINKS.events, "https://uniquebloom.cn/");
  assert.equal("rankingApplication" in LINKS, false);
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
  assert.equal(en.site.eyebrow, "Explore");
  assert.equal(en.ai.eyebrow, "For AI");
  assert.deepEqual(en.site.items.map(({ label }) => label), [
    "Research", "Data & Rankings", "Events & Awards", "Products & Services", "About", "Contact",
  ]);
  assert.equal(en.site.items[0].href, "/en/research");
  assert.equal(en.site.items[1].href, "/en/research/rankings");
  assert.equal(en.site.items[2].href, "/en/research/events-awards");
  assert.equal(en.site.items[3].href, "/en/products");
  assert.deepEqual(en.ai.items.map(({ label, href }) => ({ label, href })), [
    { label: "For AI", href: "/for-ai" },
    { label: "llms.txt", href: "/llms.txt" },
    { label: "llms-full.txt", href: "/llms-full.txt" },
    { label: "Article index", href: "/research/latest.md" },
    { label: "JSON", href: "/research/index.json" },
    { label: "Citation", href: "/for-models" },
    { label: "FAQ", href: "/faq" },
  ]);
  for (const label of [en.site.eyebrow, en.ai.eyebrow, ...en.site.items.map((item) => item.label), ...en.ai.items.map((item) => item.label)]) {
    assert.doesNotMatch(label, /[\u3400-\u9fff]/, label);
  }
  for (const label of [zh.site.eyebrow, zh.ai.eyebrow, ...zh.site.items.map((item) => item.label)]) {
    assert.match(label, /[\u3400-\u9fff]/, label);
  }
});

test("footer renders explore, For AI, and products as peer columns", async () => {
  const shell = await readFile(new URL("../src/components/editorial-home/EditorialShell.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/app/editorial-home.css", import.meta.url), "utf8");
  assert.doesNotMatch(shell, /ed-footer-explore/);
  const main = shell.slice(shell.indexOf("ed-footer-main"), shell.indexOf("ed-footer-bottom"));
  const site = main.indexOf("explore.site.eyebrow");
  const ai = main.indexOf("explore.ai.eyebrow");
  const products = main.indexOf("进入产品");
  assert.ok(site > -1 && ai > site && products > ai);
  assert.match(main, /Our Products/);
  assert.match(css, /\.ed-footer-main\{[^}]*repeat\(3,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css, /\.ed-footer-explore/);
});

test("site chrome does not invite AI ranking applications", async () => {
  const files = [
    "../src/content/editorial.mjs",
    "../src/content/home-faq.mjs",
    "../src/components/Footer.tsx",
    "../src/components/PageHero.tsx",
    "../src/components/editorial-home/EditorialHome.tsx",
    "../src/components/editorial-home/EditorialAbout.tsx",
    "../src/components/editorial-home/EditorialContact.tsx",
    "../src/components/narrative-home/NarrativeHome.jsx",
    "../src/components/narrative-home/linkMap.mjs",
    "../src/app/research/rankings/page.tsx",
    "../src/app/research/events-awards/page.tsx",
    "../src/app/en/research/rankings/page.tsx",
    "../src/app/en/research/events-awards/page.tsx",
    "../src/components/editorial-home/EnglishCuratedHub.tsx",
    "../src/app/submit/page.tsx",
  ];
  const src = (await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), "utf8")))).join("\n");
  assert.doesNotMatch(src, /shrcn5cWrPZAThRZgxd5zBf9Cxg/);
  assert.doesNotMatch(src, /申报 AI 榜单|申报榜单|我要申报|Apply for AI rankings|Apply for AI Rankings|立即提交您的AI应用|submit to our leaderboard|官方申报表单/);
});

test("homepage hero is left copy and right tools without a nav pill wall", async () => {
  const css = await readFile(new URL("../src/app/editorial-home.css", import.meta.url), "utf8");
  const home = await readFile(new URL("../src/components/editorial-home/EditorialHome.tsx", import.meta.url), "utf8");
  const hero = await readFile(new URL("../src/components/editorial-home/ResearchHero.tsx", import.meta.url), "utf8");
  assert.match(css, /\.ed-research-hero__main\{[^}]*grid-template-columns:minmax\(0,7fr\) minmax\(280px,5fr\)/);
  assert.match(css, /\.ed-site \.ed-research-hero__lead\{[^}]*width:min\(40rem,100%\)/);
  assert.match(css, /\.ed-site \.ed-research-hero__lead\{[^}]*text-align:left/);
  assert.match(css, /\.ed-site \.ed-research-hero__scale\{[^}]*width:min\(36rem,100%\)/);
  assert.doesNotMatch(css, /\.ed-research-hero__pills/);
  assert.doesNotMatch(hero, /ed-research-hero__pill|primaryNavItems|withEmphasis/);
  assert.doesNotMatch(css, /\.ed-desktop-nav\{[^}]*padding-left:\s*5%/);
  assert.match(home, /researchHubPath\('events-awards', lang\)/);
  assert.match(home, /uniqueBaseHref\(lang\)/);
  assert.doesNotMatch(home, /href="\/events"/);
  assert.doesNotMatch(home, /href=\{`\/events`\}/);
});

test("hero suggestions overlay instead of growing the ticker row", async () => {
  const search = await readFile(new URL("../src/components/editorial-home/ResearchHeroSearch.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/app/editorial-home.css", import.meta.url), "utf8");
  assert.match(search, /ed-research-hero__suggest/);
  const suggest = search.slice(search.indexOf("ed-research-hero__suggest"), search.indexOf("ed-research-hero__agents-wrap"));
  assert.ok(suggest.indexOf("ed-research-hero__preview") > suggest.indexOf("ed-research-hero__tab-hint"));
  assert.match(css, /\.ed-research-hero__suggest\{[^}]*position:relative/);
  assert.match(css, /\.ed-research-hero__preview,\.ed-research-hero__preview-empty\{[^}]*position:absolute/);
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
      primaryEn: "/en/products/uniqueresearch",
      externalZh: "https://uniqueresearch.cn",
      externalEn: "https://uniqueresearch.cn",
    },
    {
      id: "uniquebase",
      detail: "/products/uniquebase",
      primaryZh: "/products/uniquebase",
      primaryEn: "/en/products/uniquebase",
      externalZh: "https://uniquebase.cn/",
      externalEn: "https://uniquebase.ai/",
    },
    {
      id: "uniquebloom",
      detail: "/products/uniquebloom",
      primaryZh: "/products/uniquebloom",
      primaryEn: "/en/products/uniquebloom",
      externalZh: "https://uniquebloom.cn/",
      externalEn: "https://uniquebloom.cn/",
    },
    {
      id: "good-projects",
      detail: "/products/good-projects",
      primaryZh: "/products/good-projects",
      primaryEn: "/en/products/good-projects",
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
    ["hub", "../src/components/editorial-home/ProductsHub.tsx"],
    ["detail", "../src/components/editorial-home/ProductDetail.tsx"],
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

test("homepage hero title drops the brand prefix", async () => {
  const identity = await readFile(new URL("../src/content/site-identity.mjs", import.meta.url), "utf8");
  const hero = await readFile(new URL("../src/components/editorial-home/ResearchHero.tsx", import.meta.url), "utf8");
  const faq = await readFile(new URL("../src/content/home-faq.mjs", import.meta.url), "utf8");
  assert.match(identity, /export const HOME_H1 = '以 AI 研究为基础的产业资本与生态机构'/);
  assert.doesNotMatch(identity, /HOME_H1 = '非凡产研：/);
  assert.match(hero, /h1: HOME_H1/);
  assert.match(hero, /h1: 'An industry capital and ecosystem built on AI research'/);
  assert.match(hero, /UniqueResearch · Public Research Library/);
  assert.doesNotMatch(hero, /UniqueResearch:\s*an industry/);
  assert.match(faq, /非凡产研（UniqueResearch）是其研究品牌/);
});

test("editorial chrome uses the distinct research-journal identity", async () => {
  const css = await readFile(new URL("../src/app/editorial-home.css", import.meta.url), "utf8");
  const research = await readFile(new URL("../src/app/research/research.css", import.meta.url), "utf8");
  const search = await readFile(new URL("../src/components/editorial-home/ResearchHeroSearch.tsx", import.meta.url), "utf8");
  const hero = await readFile(new URL("../src/components/editorial-home/ResearchHero.tsx", import.meta.url), "utf8");
  assert.match(css, /font-family:'Segoe UI'/);
  assert.doesNotMatch(css, /Inter/);
  assert.match(css, /font-size:15px;line-height:1\.6;/);
  assert.match(css, /--ed-paper:#f7f6f1/);
  assert.match(css, /--ed-ink:#1a221c/);
  assert.match(css, /--ed-muted:#5c6758/);
  assert.match(css, /--ed-button:#1e3328/);
  assert.match(css, /--ed-focus:#4e8766/);
  assert.match(css, /--ed-rule:#ddd8cc/);
  assert.match(css, /--ed-accent:#3f6b52/);
  assert.match(css, /--ed-cell:#efece4/);
  assert.match(css, /--ed-card-line:#3f6b52/);
  assert.doesNotMatch(css, /#79946a|#263f2f|#f8f9f6|#dce1d8|#eef2e8|#7c986a/);
  assert.doesNotMatch(css, /purple|#6b5|#7c3|#8b5cf6/i);
  assert.match(css, /--ed-radius-card:6px/);
  assert.match(css, /--ed-radius-panel:7px/);
  assert.match(css, /--ed-radius-search:7px/);
  assert.match(css, /--ed-radius-button:5px/);
  assert.match(css, /--ed-radius-tag:4px/);
  assert.match(css, /--ed-radius-pill:999px/);
  assert.match(css, /--ed-search-shadow:0 3px 10px #20302005/);
  assert.match(css, /outline:3px solid var\(--ed-focus\);outline-offset:4px/);
  assert.match(css, /\.ed-research-hero__search\{[^}]*width:100%[^}]*padding:6px;[^}]*border-radius:var\(--ed-radius-search\)[^}]*box-shadow:var\(--ed-search-shadow\)/);
  assert.match(css, /\.ed-research-hero__search input\{[^}]*font-size:13px/);
  assert.match(css, /\.ed-button,\.ed-research-hero__search button,\.ed-research-hero__cta-primary\{[^}]*border-radius:var\(--ed-radius-button\)[^}]*min-height:43px;padding:12px 20px;[^}]*gap:18px;[^}]*font-size:12px/);
  assert.match(css, /\.ed-research-hero\{[^}]*padding:96px 0 80px/);
  assert.match(css, /\.ed-research-hero__copy h1\{[^}]*font-family:var\(--ed-display\)|\.ed-site :is\(\.ed-research-hero__copy h1/);
  assert.match(css, /\.rs-article-header h1/);
  assert.match(css, /\.rs-related h2/);
  assert.match(css, /\.rs-page-heading/);
  assert.match(css, /\.ed-research-hero__copy h1\{[^}]*font-weight:400;line-height:1\.18;letter-spacing:-\.025em/);
  assert.match(css, /\.ed-site \.ed-research-hero__lead\{[^}]*font-size:16px;line-height:1\.75;color:var\(--ed-muted\)/);
  assert.match(css, /\.ed-site \.ed-research-hero__kicker\{[^}]*margin:0 0 28px/);
  assert.match(css, /\.ed-site\{overflow-x:clip/);
  assert.doesNotMatch(css, /\.ed-site\{overflow:clip/);
  assert.doesNotMatch(css, /\.ed-research-hero__search button:hover/);
  assert.match(css, /\.ed-research-hero__dot\{[^}]*width:5px;height:5px/);
  assert.doesNotMatch(css, /\.ed-research-hero__copy h1 em/);
  assert.doesNotMatch(css, /font-style:italic/);
  assert.doesNotMatch(css, /border-radius:1[024]px/);
  assert.doesNotMatch(css, /@keyframes/);
  assert.match(search, /className="ed-button"/);
  assert.doesNotMatch(hero, /<em>|withEmphasis|emphasis:/);
  assert.match(research, /\.rs-search button\{[^}]*min-height:43px;padding:12px 20px;[^}]*font-size:12px;[^}]*border-radius:var\(--ed-radius-button,5px\)/);
  assert.match(research, /\.rs-search input:not\(\[type=hidden\]\),\.rs-search select\{[^}]*font-size:13px[^}]*background:#fbfcfa[^}]*height:44px;min-height:44px/);
  assert.doesNotMatch(research, /\.rs-search input\{font-size:18px/);
  assert.match(research, /outline:3px solid var\(--ed-focus,#4e8766\);outline-offset:4px/);
  assert.doesNotMatch(research, /outline:2px/);
  assert.match(research, /\.rs-meta\{[^}]*font-size:11px;color:var\(--ed-muted\)/);
  assert.doesNotMatch(research, /\.rs-meta\{[^}]*text-transform:uppercase/);
  assert.match(research, /var\(--ed-accent,#3f6b52\)/);
  assert.doesNotMatch(research, /#79946a/);
  const type = await readFile(new URL("../src/styles/typography.css", import.meta.url), "utf8");
  assert.match(type, /body \.ed-site,\nbody \.ed-dialog \{[^}]*font-size: 15px;[^}]*line-height: 1\.6;/);
  assert.match(type, /letter-spacing: -0\.03em;/);
  assert.match(type, /Georgia, "Times New Roman", "Songti SC", "Noto Serif SC", serif/);
  assert.match(type, /ed-research-hero__copy h1 \{[^}]*letter-spacing: -0\.025em;/);
  assert.match(type, /\.rs-article-header h1/);
  assert.match(type, /\.rs-related h2/);
  assert.match(type, /\.rs-page-heading/);
  assert.doesNotMatch(type, /Inter/);
});

test("secondary pages share the research-journal display stack and sentence-case chrome", async () => {
  assert.equal(productsHubPath("zh"), "/products");
  assert.equal(productsHubPath("en"), "/en/products");
  assert.equal(productDetailPath("uniquebase", "en"), "/en/products/uniquebase");
  const files = Object.fromEntries(await Promise.all([
    ["zhArchive", "../src/app/research/page.tsx"],
    ["enArchive", "../src/app/en/research/page.tsx"],
    ["enArticle", "../src/app/en/research/[slug]/page.tsx"],
    ["enProducts", "../src/app/en/products/page.tsx"],
    ["enProductDetail", "../src/app/en/products/[slug]/page.tsx"],
    ["productDetail", "../src/components/editorial-home/ProductDetail.tsx"],
    ["about", "../src/components/editorial-home/EditorialAbout.tsx"],
    ["contact", "../src/components/editorial-home/EditorialContact.tsx"],
    ["world", "../src/components/editorial-home/InfiniteWorldHero.tsx"],
  ].map(async ([name, file]) => [name, await readFile(new URL(file, import.meta.url), "utf8")])));
  assert.match(files.zhArchive, /把分散的行业信号，放回同一张图景。/);
  assert.match(files.zhArchive, /ed-secondary ed-topo-quiet/);
  assert.match(files.zhArchive, /rs-feed/);
  assert.doesNotMatch(files.zhArchive, /rs-directions|rs-search|role="search"|检索文章|全部方向/);
  assert.match(files.enArchive, /Read the English research articles in full\./);
  assert.match(files.enArchive, /ed-secondary ed-topo-quiet/);
  assert.match(files.enArchive, /rs-feed/);
  assert.match(files.enArchive, /ed-eyebrow">UniqueResearch</);
  assert.match(files.enArchive, /<span>Unique research<\/span>/);
  assert.match(files.enArchive, /English article/);
  assert.doesNotMatch(files.enArchive, /rs-directions|rs-search|role="search"|Search English articles/);
  assert.doesNotMatch(files.enArchive, /UNIQUE RESEARCH|ENGLISH ARCHIVE|ENGLISH ARTICLE/);
  assert.match(files.enArticle, /English Article/);
  assert.match(files.enArticle, /rs-article-header/);
  assert.doesNotMatch(files.enArticle, /UNIQUE RESEARCH|ENGLISH ARTICLE/);
  assert.match(files.enProducts, /ProductsHub/);
  assert.match(files.enProducts, /\/en\/products/);
  assert.match(files.enProductDetail, /ProductDetail/);
  assert.match(files.enProductDetail, /\/en\/products/);
  assert.match(files.productDetail, /rs-article-header/);
  assert.match(files.productDetail, /rs-page-heading/);
  assert.match(files.about, /01 \/ 研究/);
  assert.match(files.about, /01 \/ Research/);
  assert.doesNotMatch(files.about, /01 \/ RESEARCH/);
  assert.match(files.contact, /联系人/);
  assert.doesNotMatch(files.contact, /RESEARCH · RANKINGS · DATA/);
  assert.match(files.world, /The Future Is Not a Spectator Sport/);
  assert.match(files.world, /Exploration Mode/);
  assert.doesNotMatch(files.world, /THE FUTURE IS NOT A SPECTATOR SPORT|EXPLORATION MODE|UNIQUE WORLDS/);
});

test('source end dates are inclusive and ended activities remain archived', () => {
  const event = { kind: 'event', date: '2026-03-24', endDate: '2026-03-29' };
  assert.equal(eventStatus(event, '2026-03-29T23:59:59+08:00'), 'live');
  assert.equal(eventStatus(event, '2026-03-30T00:00:00+08:00'), 'past');
  assert.equal(eventStatus({ ...event, status: 'ended' }, '2026-03-24T12:00:00+08:00'), 'past');
});

test("option B panels keep topo, per-product motifs, and reduced motion", async () => {
  const [css, motion, hub, home, contact, motifs, docs] = await Promise.all([
    "../src/app/editorial-home.css",
    "../src/app/editorial-motion.css",
    "../src/components/editorial-home/ProductsHub.tsx",
    "../src/components/editorial-home/EditorialHome.tsx",
    "../src/components/editorial-home/EditorialContact.tsx",
    "../src/components/editorial-home/panel-motifs.mjs",
    "../docs/design/panel-backgrounds-b.md",
  ].map(file => readFile(new URL(file, import.meta.url), "utf8")));
  assert.match(css, /\.ed-panel/);
  assert.match(css, /\.ed-reading-hub/);
  assert.match(css, /topo-contour\.svg/);
  assert.doesNotMatch(css, /@keyframes/);
  for (const name of ["uniqueresearch", "uniquebase", "uniquebloom", "goodprojects"]) {
    assert.match(css, new RegExp(`/editorial/motifs/${name}\\.jpg`));
  }
  assert.match(motion, /ed-topo-drift/);
  assert.match(motion, /prefers-reduced-motion:\s*reduce/);
  assert.match(motion, /\.ed-topo-hub::before/);
  assert.match(motion, /ed-topo-drift 56s ease-in-out infinite/);
  assert.doesNotMatch(motion, /\.ed-panel::before[\s\S]{0,120}ed-topo-drift[\s\S]{0,80}infinite/);
  assert.match(motion, /\.ed-panel\.ed-product:is\(:hover,\s*:focus-within\)/);
  assert.match(motion, /prefers-reduced-motion:\s*reduce[\s\S]*transition:\s*opacity[^;]+,\s*filter/);
  assert.doesNotMatch(motion, /\.ed-panel::(?:before|after)[\s\S]{0,80}transition:\s*none\s*!important/);
  assert.match(css, /\.ed-panel\.ed-product:is\(:hover,:focus-within\)::after/);
  assert.match(css, /filter:grayscale/);
  assert.match(css, /\.ed-panel\.ed-product:is\(:hover,:focus-within\)\{[^}]*radial-gradient/);
  assert.match(css, /rgba\(232,196,148/);
  assert.match(css, /rgba\(243,234,214/);
  assert.match(css, /\.ed-panel\.ed-product:is\(:hover,:focus-within\)::before\{[^}]*grayscale\(0\)[^}]*saturate\(1\)/);
  assert.match(css, /\.ed-panel\.ed-product:is\(:hover,:focus-within\)::after\{[^}]*grayscale\(0\)[^}]*saturate\(1\)/);
  assert.doesNotMatch(css, /sepia\(/);
  assert.doesNotMatch(css, /hue-rotate\(/);
  assert.doesNotMatch(css, /rgba\(196,112,74/);
  assert.doesNotMatch(css, /\.ed-panel\.ed-product:is\(:hover,:focus-within\)::(?:before|after)\{[^}]*saturate\(1\.[24]\)/);
  assert.match(hub, /productPrimaryHref/);
  assert.match(hub, /data-motif/);
  assert.match(hub, /ed-panel/);
  assert.doesNotMatch(hub, /href=\{product\.href\}/);
  assert.match(home, /ed-panel/);
  assert.match(home, /data-motif/);
  assert.match(contact, /ed-reading-hub/);
  assert.doesNotMatch(contact, /editorial\/motifs/);
  assert.match(motifs, /"good-projects": "goodprojects"/);
  assert.match(docs, /cream \/ amber/);
  assert.match(docs, /植物标本/);
  assert.match(docs, /去掉 `grayscale`/);
  assert.doesNotMatch(docs, /饱和到林绿/);
  assert.doesNotMatch(docs, /sepia \+ `hue-rotate`/);
});
