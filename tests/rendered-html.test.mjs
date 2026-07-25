import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const output = new URL("../out/index.html", import.meta.url);

test("exports the financial report product", async () => {
  const html = await readFile(output, "utf8");

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /财报分析排行榜/);
  assert.match(html, /公司财报对比/);
  assert.match(html, /评分方法/);
  assert.match(html, /思航研究/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});
