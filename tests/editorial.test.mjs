import assert from "node:assert/strict";
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
    assert.equal(new URL(event.href).origin, 'https://uniquebloom.cn');
    assert.equal(new URL(event.href).pathname, event.slug ? `/${event.slug}` : `/activities/${event.id}`);
    assert.ok(event.date && event.title.zh && event.location.zh);
  }
  assert.equal(CONTENT.filter(item => item.kind === 'publication').length, 1);
  assert.equal(LINKS.report, "/research");
  assert.equal(LINKS.rankingsHub, "/research/rankings");
  assert.equal(LINKS.contact, "/contact");
  assert.equal(LINKS.events, "https://uniquebloom.cn/");
  assert.equal(LINKS.rankingApplication, "https://uniquecapital.feishu.cn/share/base/form/shrcn5cWrPZAThRZgxd5zBf9Cxg");
  assert.deepEqual(PRODUCTS.map(({ href }) => href), [
    "/research/rankings",
    "https://uniquebase.cn/",
    "https://uniquebloom.cn/",
    "https://ffcap.cn/bp.html",
  ]);
  const published = JSON.stringify({ TOPICS, CONTENT, PRODUCTS, LINKS });
  assert.doesNotMatch(published, /flash-fundraising|极速融资|Flash Fundraising/i);
  for (const item of [...TOPICS, ...CONTENT]) {
    assert.ok(item.title.zh && item.title.en);
    assert.equal(typeof item.description.zh, "string");
    assert.equal(typeof item.description.en, "string");
    assert.equal(new URL(item.href).protocol, "https:");
  }
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


test('source end dates are inclusive and ended activities remain archived', () => {
  const event = { kind: 'event', date: '2026-03-24', endDate: '2026-03-29' };
  assert.equal(eventStatus(event, '2026-03-29T23:59:59+08:00'), 'live');
  assert.equal(eventStatus(event, '2026-03-30T00:00:00+08:00'), 'past');
  assert.equal(eventStatus({ ...event, status: 'ended' }, '2026-03-24T12:00:00+08:00'), 'past');
});
