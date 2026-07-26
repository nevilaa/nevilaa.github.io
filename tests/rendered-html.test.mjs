import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const output = new URL("../out/index.html", import.meta.url);

test("exports the extensible earnings research workbench", async () => {
  const html = await readFile(output, "utf8");

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /思航研究｜财报工作台/);
  assert.match(html, /正在连接财报数据服务器/);
  assert.match(html, /思航研究/);
  assert.match(html, /财报工作台/);
  assert.doesNotMatch(html, /公司财报对比|NVIDIA|Microsoft/);
});
