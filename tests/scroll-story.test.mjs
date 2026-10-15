import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssUrl = new URL("../src/app/narrative-home.css", import.meta.url);
const componentUrl = new URL("../src/components/narrative-home/NarrativeHome.jsx", import.meta.url);

test("keeps the scroll story sticky to the document scroller", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /overflow-x:\s*clip;/);
  assert.doesNotMatch(css, /overflow-x:\s*hidden;/);
});

test("gives all three story beats a deliberate reading distance", async () => {
  const [css, component] = await Promise.all([
    readFile(cssUrl, "utf8"),
    readFile(componentUrl, "utf8"),
  ]);

  assert.match(css, /height:\s*450svh;/);
  assert.match(css, /height:\s*420svh;/);
  assert.match(css, /max-height:\s*720px[\s\S]*?\.scroll-story-sticky[\s\S]*?min-height:\s*0;/);
  assert.match(component, /\[0\.04, 0\.1, 0\.31, 0\.38\]/);
  assert.match(component, /\[0\.31, 0\.38, 0\.62, 0\.69\]/);
  assert.match(component, /\[0\.62, 0\.69, 0\.9, 0\.97\]/);
  assert.match(component, /\[0, 1, 1, isLastBeat \? 1 : 0\]/);
});
