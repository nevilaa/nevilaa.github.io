import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const output = new URL("../out/index.html", import.meta.url);

test("exports the Meituan earnings research product", async () => {
  const html = await readFile(output, "utf8");

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /美团 2026 Q1 财报深度分析/);
  assert.match(html, /正在连接财报数据服务器/);
  assert.match(html, /思航研究/);
  assert.doesNotMatch(html, /公司财报对比|NVIDIA|Microsoft/);
});
