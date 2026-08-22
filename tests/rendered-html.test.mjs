import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portalOutput = new URL("../out/index.html", import.meta.url);
const earningsOutput = new URL("../out/earnings/index.html", import.meta.url);
const portalSource = new URL("../app/page.tsx", import.meta.url);
const stylesSource = new URL("../app/globals.css", import.meta.url);
const deploySource = new URL("../deploy/deploy.sh", import.meta.url);
const reportCatalogSource = new URL("../app/report-catalog.ts", import.meta.url);
const publicCatalogSource = new URL("../public/data/catalog.json", import.meta.url);

test("exports the two-frame personal research portal", async () => {
  const html = await readFile(portalOutput, "utf8");

  assert.match(html, /<html lang="zh-CN"/);
  assert.match(html, /思航研究｜财报分析与 AI 热点/);
  assert.match(html, /财报分析/);
  assert.match(html, /AI 热点/);
  assert.match(html, /\/earnings\//);
  assert.match(html, /\/ai-radar\//);
  assert.match(html, /京ICP备2026051102号-1/);
  assert.match(html, /https:\/\/beian\.miit\.gov\.cn\//);
  assert.match(
    html,
    /property="og:url" content="https:\/\/www\.shresearch\.cn\/"/,
  );
});

test("keeps the extensible earnings research workbench", async () => {
  const html = await readFile(earningsOutput, "utf8");

  assert.match(html, /正在连接财报数据服务器/);
  assert.match(html, /思航研究/);
  assert.match(html, /财报工作台/);
  assert.match(html, /返回首页导航/);
  assert.match(html, /京ICP备2026051102号-1/);
  assert.match(html, /https:\/\/beian\.miit\.gov\.cn\//);
  assert.doesNotMatch(html, /公司财报对比|NVIDIA|Microsoft/);
});

test("self-hosts the MiniMax and PDD company icons", async () => {
  const html = await readFile(earningsOutput, "utf8");

  assert.match(html, /\/company-icons\/minimax\.png/);
  assert.match(html, /\/company-icons\/pdd\.png/);
  assert.doesNotMatch(html, /icons\.duckduckgo\.com\/ip3\/www\.minimax\.io/);
  assert.doesNotMatch(html, /icons\.duckduckgo\.com\/ip3\/www\.pinduoduo\.com/);
});

test("keeps the homepage split stable instead of expanding panels on hover", async () => {
  const [page, styles] = await Promise.all([
    readFile(portalSource, "utf8"),
    readFile(stylesSource, "utf8"),
  ]);

  assert.doesNotMatch(page, /onMouseEnter/);
  assert.doesNotMatch(page, /portal-focus-/);
  assert.doesNotMatch(styles, /\.portal-focus-earnings/);
  assert.match(styles, /\.portal-stage \{[\s\S]*?height: auto;/);
});

test("blocks deployments from uncommitted or unpushed source", async () => {
  const script = await readFile(deploySource, "utf8");

  assert.match(script, /status --porcelain --untracked-files=all/);
  assert.match(script, /fetch origin main/);
  assert.match(script, /rev-parse origin\/main/);
  assert.match(script, /Commit and push the complete site before deploying/);
});

test("publishes a validated FY2025 report for every tracked company", async () => {
  const [registry, publicCatalogText] = await Promise.all([
    readFile(reportCatalogSource, "utf8"),
    readFile(publicCatalogSource, "utf8"),
  ]);
  const publicCatalog = JSON.parse(publicCatalogText);
  const fy2025 = publicCatalog.reports.filter((report) =>
    report.period.includes("FY2025"),
  );

  assert.equal(
    (registry.match(/fiscalYear: 2025,\n\s+quarter: "FY"/g) ?? []).length,
    13,
  );
  assert.equal(fy2025.length, 13);

  for (const report of fy2025) {
    const dataFile = new URL(
      `../public/data/${new URL(report.data_url, "https://www.shresearch.cn/data/").pathname.split("/").at(-1)}`,
      import.meta.url,
    );
    const payload = JSON.parse(await readFile(dataFile, "utf8"));

    assert.equal(payload.modules.length, 9, report.id);
    assert.ok(payload.socratic_review.questions.length >= 8, report.id);
    assert.ok(payload.socratic_review.surviving_insights.length >= 1, report.id);
    assert.equal(
      payload.scenarios.reduce((sum, scenario) => sum + scenario.probability, 0),
      100,
      report.id,
    );
  }
});
