import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  FOCUSABLE_SELECTOR,
  HOME_NAV_ITEMS,
  PRODUCT_LINKS,
  SITE_LINKS,
} from "../src/components/narrative-home/linkMap.mjs";

test("uses the approved public link contracts", () => {
  assert.equal(SITE_LINKS.report, "/research");
  assert.equal(SITE_LINKS.rankingsHub, "/research/rankings");
  assert.equal(SITE_LINKS.contact, "/contact");
  assert.equal(SITE_LINKS.uniqueBase, "https://uniquebase.cn/");
  assert.equal(SITE_LINKS.uniqueBloom, "https://uniquebloom.cn/");
  assert.equal(SITE_LINKS.goodProjects, "https://ffcap.cn/bp.html");
  assert.equal(SITE_LINKS.about, "/about");
  assert.equal(
    SITE_LINKS.rankingApplication,
    "https://uniquecapital.feishu.cn/share/base/form/shrcn5cWrPZAThRZgxd5zBf9Cxg",
  );
});

test("keeps desktop and mobile navigation on one internal map", () => {
  assert.deepEqual(HOME_NAV_ITEMS, [
    { label: "首页", href: "#top" },
    { label: "研究与榜单", href: "#research" },
    { label: "产品矩阵", href: "#products" },
    { label: "活动与生态", href: "#ecosystem" },
    { label: "关于我们", href: "/about" },
  ]);
});

test("publishes only the three approved products", () => {
  assert.deepEqual(PRODUCT_LINKS.map(({ name, href }) => ({ name, href })), [
    { name: "UniqueBase", href: SITE_LINKS.uniqueBase },
    { name: "UniqueBloom", href: SITE_LINKS.uniqueBloom },
    { name: "有好项目", href: SITE_LINKS.goodProjects },
  ]);

  const publicHrefs = [
    ...HOME_NAV_ITEMS.map((item) => item.href),
    ...PRODUCT_LINKS.map((item) => item.href),
    SITE_LINKS.report,
  ];
  assert.equal(publicHrefs.some((href) => href.includes("/flash-fundraising")), false);
  assert.equal(publicHrefs.some((href) => href.includes("/funding-agent")), false);
  assert.equal(publicHrefs.some((href) => href.includes("feishu.cn/wiki")), false);
});

test("includes links in the intent panel focus loop", () => {
  assert.match(FOCUSABLE_SELECTOR, /button/);
  assert.match(FOCUSABLE_SELECTOR, /a\[href\]/);
});

test("removes the retired product and private wiki links from visible navigation surfaces", async () => {
  const files = await Promise.all([
    readFile(new URL("../src/components/narrative-home/NarrativeHome.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Navbar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/about/page.tsx", import.meta.url), "utf8"),
  ]);
  const visibleSources = files.join("\n");

  assert.doesNotMatch(visibleSources, /极速融资|Flash Fundraising/);
  assert.doesNotMatch(visibleSources, /\/flash-fundraising/);
  assert.doesNotMatch(visibleSources, /uniquecapital\.feishu\.cn\/wiki/);
  assert.doesNotMatch(visibleSources, /href=["{']?\/funding-agent/);
  assert.match(visibleSources, /UniqueBase/);
});
