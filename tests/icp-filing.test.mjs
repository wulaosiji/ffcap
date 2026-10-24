import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const LABEL = "沪ICP备2025111002号-4";
const HREF = "https://beian.miit.gov.cn/";

test("site footers share one static ICP filing link", async () => {
  const link = await readFile(new URL("../src/components/IcpFilingLink.tsx", import.meta.url), "utf8");
  assert.match(link, new RegExp(LABEL));
  assert.match(link, new RegExp(HREF.replaceAll(".", "\\.")));
  assert.match(link, /target="_blank"/);
  assert.match(link, /rel="noopener noreferrer"/);
  assert.doesNotMatch(link, /use client|useEffect|公安/);

  const footer = await readFile(new URL("../src/components/Footer.tsx", import.meta.url), "utf8");
  const editorial = await readFile(
    new URL("../src/components/editorial-home/EditorialShell.tsx", import.meta.url),
    "utf8",
  );
  for (const source of [footer, editorial]) {
    assert.match(source, /<IcpFilingLink\b/);
    assert.doesNotMatch(source, new RegExp(LABEL));
    assert.doesNotMatch(source, /公安备案|beian\.mps\.gov\.cn/);
  }
});
