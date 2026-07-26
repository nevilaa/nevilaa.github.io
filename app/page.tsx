"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COMPANY_OPTIONS,
  getDefaultReport,
  PUBLISHED_REPORTS,
  reportsForCompany,
  type ReportCatalogEntry,
} from "./report-catalog";
import type {
  KeyMetric,
  ReportData,
  Scenario,
  Tone,
} from "./report-types";

type ModuleId =
  | "business"
  | "cost"
  | "balance"
  | "management"
  | "competition"
  | "external"
  | "market"
  | "scenario"
  | "memo";

type ResearchModule = {
  id: ModuleId;
  index: number;
  group: "财务事实" | "经营解释" | "投资判断";
  title: string;
  question: string;
  sourceLayerId?: string;
};

const RESEARCH_MODULES: ResearchModule[] = [
  {
    id: "business",
    index: 1,
    group: "财务事实",
    title: "业务拆解",
    question: "增长由量、价还是货币化驱动？",
    sourceLayerId: "business",
  },
  {
    id: "cost",
    index: 2,
    group: "财务事实",
    title: "成本效率",
    question: "利润变化发生在哪一条费用线上？",
    sourceLayerId: "cost",
  },
  {
    id: "balance",
    index: 3,
    group: "财务事实",
    title: "现金与资产",
    question: "现金流与资产负债表是否验证利润？",
    sourceLayerId: "balance",
  },
  {
    id: "management",
    index: 4,
    group: "经营解释",
    title: "管理层信号",
    question: "强调、承诺与回避分别是什么？",
    sourceLayerId: "management",
  },
  {
    id: "competition",
    index: 5,
    group: "经营解释",
    title: "竞争格局",
    question: "短期和长期威胁来自谁？",
    sourceLayerId: "competition",
  },
  {
    id: "external",
    index: 6,
    group: "经营解释",
    title: "外部变量",
    question: "监管、消费与地缘如何传导？",
    sourceLayerId: "external",
  },
  {
    id: "market",
    index: 7,
    group: "投资判断",
    title: "市场定价",
    question: "股价在奖励和担心什么？",
    sourceLayerId: "market",
  },
  {
    id: "scenario",
    index: 8,
    group: "投资判断",
    title: "情景与验证",
    question: "下一季度有哪些概率路径与验证点？",
    sourceLayerId: "future",
  },
  {
    id: "memo",
    index: 9,
    group: "投资判断",
    title: "研究结论",
    question: "什么判断值得带走，什么会推翻它？",
  },
];

const MODULE_GROUPS = ["财务事实", "经营解释", "投资判断"] as const;

function formatSigned(value: number, suffix = "") {
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

function formatRange(range: [number, number], unit: string) {
  return `${formatSigned(range[0])} – ${formatSigned(range[1])} ${unit}`;
}

function metricContext(metric: KeyMetric) {
  if (metric.qoqText) return metric.qoqText;
  if (metric.yoyText) return metric.yoyText;
  if (typeof metric.yoy === "number") {
    return `同比 ${formatSigned(metric.yoy, "%")}`;
  }
  return "暂无可比口径";
}

function toneLabel(tone: Tone) {
  if (tone === "positive") return "正面";
  if (tone === "negative") return "承压";
  return "观察";
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function strategicSummary(data: ReportData) {
  if (data.thesis.strategicSummary) {
    return data.thesis.strategicSummary;
  }

  const layer = (id: string) =>
    data.analysisLayers.find((item) => item.id === id);
  const management = layer("management");
  const business = layer("business");
  const cost = layer("cost");
  const competition = layer("competition");
  const future = layer("future");
  const managementSignals = management?.signals ?? [];
  const watchlist = future?.watchlist ?? [];

  return {
    primaryDifficulty: `${data.company.name}当前最难的不是获得增长，而是在竞争投入侵蚀核心利润时守住用户与商家基本盘，并证明新增投入能形成更好的单位经济。`,
    strategicJudgment:
      "管理层正在用核心业务的短期利润换取防守时间，同时把资源投向即时零售、海外和 AI。方向已经明确，财务兑现仍处在验证期。",
    currentChallenges: [
      {
        title: "核心利润与市场份额难以同时守住",
        evidence:
          cost?.verdict ??
          competition?.verdict ??
          "竞争投入正在压低核心业务利润。",
        implication:
          "如果补贴退坡后单位经济不能修复，规模优势将难以重新转化为利润。",
      },
      {
        title: "新增长业务尚未证明增长质量",
        evidence:
          business?.verdict ??
          "即时零售与海外业务增长，但单位经济仍需更多季度验证。",
        implication:
          "收入增量只有在履约效率和亏损率同步改善时，才会成为可持续的第二曲线。",
      },
      {
        title: "长期战略还缺少可量化兑现",
        evidence:
          management?.verdict ??
          "战略叙事已经变化，但缺少用户、收入或效率指标。",
        implication:
          "AI 与海外目前更多影响长期估值想象，尚未形成可验证的利润贡献。",
      },
    ],
    futureDirections: [
      {
        title: "守住外卖基本盘，优先修复单位经济",
        rationale:
          "核心业务仍是现金流与用户入口，战略转型必须先稳定这一底座。",
        managementSignal:
          managementSignals.find((item) => item.speaker.includes("CFO"))
            ?.signal ?? "管理层承诺改善外卖单位经济",
        validation:
          watchlist[0]
            ? `${watchlist[0].metric}：${watchlist[0].target}`
            : data.thesis.falsifiableSignal,
      },
      {
        title: "把即时零售做成第二个规模业务",
        rationale:
          "闪购和自营零售承接更高频、更广品类需求，是本地生活平台的自然延伸。",
        managementSignal:
          managementSignals.find((item) => item.signal.includes("零售"))
            ?.signal ?? "继续推进零售与科技战略",
        validation:
          watchlist[2]
            ? `${watchlist[2].metric}：${watchlist[2].target}`
            : "扩张同时保持履约效率与亏损率改善",
      },
      {
        title: "用海外与 AI 培育长期增长期权",
        rationale:
          "国内核心业务成熟后，海外市场和智能化能力决定增长边界能否继续外扩。",
        managementSignal:
          managementSignals.find((item) => item.signal.includes("AI"))
            ?.signal ?? "把 AI 与海外列为长期战略方向",
        validation:
          watchlist[3]
            ? `${watchlist[3].metric}：${watchlist[3].target}`
            : "披露可核验的用户、收入或效率贡献",
      },
    ],
  };
}

function ArrowUpRightIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="M4 12 12 4M6 4h6v6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <ellipse cx="8" cy="4" rx="5" ry="2" />
      <path d="M3 4v4c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8v4c0 1.1 2.2 2 5 2s5-.9 5-2V8" />
    </svg>
  );
}

function SourceType({ type }: { type: string }) {
  const labels: Record<string, string> = {
    company: "公司公告",
    media: "媒体",
    transcript: "电话会",
    data: "数据",
  };
  return <span className="source-type">{labels[type] ?? type}</span>;
}

function ReportSelectors({
  selectedReport,
  onSelectReport,
}: {
  selectedReport: ReportCatalogEntry;
  onSelectReport: (id: string) => void;
}) {
  const companyReports = reportsForCompany(selectedReport.companyId);

  function selectCompany(companyId: string) {
    const latest = reportsForCompany(companyId)[0];
    if (latest) onSelectReport(latest.id);
  }

  return (
    <div className="report-selectors" aria-label="公司与财季切换">
      <label className="select-control">
        <span>公司</span>
        <span className="select-value">
          <select
            aria-label="选择公司"
            value={selectedReport.companyId}
            onChange={(event) => selectCompany(event.target.value)}
          >
            {COMPANY_OPTIONS.map((company) => (
              <option value={company.id} key={company.id}>
                {company.name} · {company.ticker}
              </option>
            ))}
          </select>
          <ChevronDownIcon />
        </span>
      </label>
      <label className="select-control">
        <span>财季</span>
        <span className="select-value">
          <select
            aria-label="选择财季"
            value={selectedReport.id}
            onChange={(event) => onSelectReport(event.target.value)}
          >
            {companyReports.map((report) => (
              <option value={report.id} key={report.id}>
                {report.periodLabel}
              </option>
            ))}
          </select>
          <ChevronDownIcon />
        </span>
      </label>
    </div>
  );
}

function AppHeader({
  selectedReport,
  onSelectReport,
  sourceUrl,
}: {
  selectedReport: ReportCatalogEntry;
  onSelectReport: (id: string) => void;
  sourceUrl?: string;
}) {
  return (
    <header className="app-header">
      <a className="product-brand" href="#report-top" aria-label="思航研究首页">
        <span className="product-mark" aria-hidden="true">
          SR
        </span>
        <span>
          <strong>思航研究</strong>
          <small>财报工作台</small>
        </span>
      </a>
      <ReportSelectors
        selectedReport={selectedReport}
        onSelectReport={onSelectReport}
      />
      <div className="header-actions">
        <span className="sync-state">
          <i />
          数据在线
        </span>
        {sourceUrl ? (
          <a
            className="icon-link"
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="打开财报原文"
            title="财报原文"
          >
            <ArrowUpRightIcon />
          </a>
        ) : (
          <span className="icon-link is-disabled" aria-hidden="true">
            <ArrowUpRightIcon />
          </span>
        )}
      </div>
    </header>
  );
}

function ResearchLibrary({
  selectedReport,
  onSelectReport,
}: {
  selectedReport: ReportCatalogEntry;
  onSelectReport: (id: string) => void;
}) {
  return (
    <aside className="library-sidebar" aria-label="研究资料库">
      <div className="sidebar-section">
        <div className="sidebar-heading">
          <span>研究库</span>
          <span>{COMPANY_OPTIONS.length} 家公司</span>
        </div>
        <div className="company-list">
          {COMPANY_OPTIONS.map((company) => {
            const reports = reportsForCompany(company.id);
            const active = company.id === selectedReport.companyId;
            return (
              <button
                type="button"
                className={active ? "company-item is-active" : "company-item"}
                key={company.id}
                onClick={() => onSelectReport(reports[0].id)}
                aria-current={active ? "page" : undefined}
              >
                <span className="company-monogram">
                  {company.nameEn.slice(0, 1)}
                </span>
                <span>
                  <strong>{company.name}</strong>
                  <small>
                    {company.ticker} · {reports.length} 份
                  </small>
                </span>
              </button>
            );
          })}
        </div>
        <div className="future-slot">
          <PlusIcon />
          <span>
            <strong>扩展位已预留</strong>
            <small>新增公司后自动进入选择器</small>
          </span>
        </div>
      </div>

      <div className="sidebar-section period-section">
        <div className="sidebar-heading">
          <span>已发布财季</span>
          <span>{reportsForCompany(selectedReport.companyId).length}</span>
        </div>
        <div className="period-list">
          {reportsForCompany(selectedReport.companyId).map((report) => (
            <button
              type="button"
              key={report.id}
              className={report.id === selectedReport.id ? "is-active" : ""}
              onClick={() => onSelectReport(report.id)}
              aria-current={report.id === selectedReport.id ? "page" : undefined}
            >
              <span>{report.periodLabel}</span>
              <small>{report.status === "published" ? "已发布" : "草稿"}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-note">
        <DatabaseIcon />
        <p>
          财报正文与结构化字段由独立数据服务器提供，页面只负责读取和呈现。
        </p>
      </div>
    </aside>
  );
}

function MetricTable({ metrics }: { metrics: KeyMetric[] }) {
  return (
    <div className="table-frame metric-table-frame">
      <table className="metric-table">
        <thead>
          <tr>
            <th scope="col">指标</th>
            <th scope="col">本期值</th>
            <th scope="col">趋势 / 对比</th>
            <th scope="col">市场预期</th>
            <th scope="col">判断</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.id}>
              <th scope="row">{metric.label}</th>
              <td className="metric-value">
                {metric.value}
                <span>{metric.unit}</span>
              </td>
              <td>{metricContext(metric)}</td>
              <td>
                {typeof metric.consensus === "number"
                  ? `${metric.consensus} ${metric.consensusUnit}`
                  : "—"}
              </td>
              <td>
                <span className={`status-label status-${metric.tone}`}>
                  {toneLabel(metric.tone)} · {metric.result}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScenarioTable({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <div className="table-frame">
      <table className="scenario-table">
        <thead>
          <tr>
            <th scope="col">情景</th>
            <th scope="col">概率</th>
            <th scope="col">触发条件</th>
            <th scope="col">核心本地商业利润</th>
            <th scope="col">经调整净利润</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => (
            <tr key={scenario.id}>
              <th scope="row">
                <span className={`scenario-dot dot-${scenario.tone}`} />
                {scenario.name}
              </th>
              <td>
                <div className="probability-cell">
                  <strong>{scenario.probability}%</strong>
                  <span>
                    <i style={{ width: `${scenario.probability}%` }} />
                  </span>
                </div>
              </td>
              <td>{scenario.triggers.join("；")}</td>
              <td>{formatRange(scenario.coreLocalProfitRange, scenario.unit)}</td>
              <td>
                {formatRange(scenario.adjustedNetProfitRange, scenario.unit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LayerHeading({
  module,
  verdict,
}: {
  module: ResearchModule;
  verdict: string;
}) {
  return (
    <>
      <div className="module-panel-heading">
        <div>
          <span className="module-index">
            {String(module.index).padStart(2, "0")}
          </span>
          <div>
            <p>{module.group}</p>
            <h3>{module.title}</h3>
          </div>
        </div>
        <p>{module.question}</p>
      </div>
      <div className="module-verdict">
        <span>当前结论</span>
        <p>{verdict}</p>
      </div>
    </>
  );
}

function LayerContent({
  module,
  data,
}: {
  module: ResearchModule;
  data: ReportData;
}) {
  const layer = module.sourceLayerId
    ? data.analysisLayers.find((item) => item.id === module.sourceLayerId)
    : undefined;
  const verdict =
    module.id === "memo"
      ? data.thesis.headline
      : layer?.verdict ?? "当前数据尚未覆盖本模块。";

  return (
    <article className="module-panel" key={module.id}>
      <LayerHeading module={module} verdict={verdict} />

      {module.id === "business" && layer?.items && (
        <div className="table-frame">
          <table>
            <thead>
              <tr>
                <th scope="col">业务</th>
                <th scope="col">量</th>
                <th scope="col">价 / 货币化</th>
                <th scope="col">净效果</th>
              </tr>
            </thead>
            <tbody>
              {layer.items.map((item) => (
                <tr key={item.name}>
                  <th scope="row">{item.name}</th>
                  <td>{item.volume}</td>
                  <td>{item.price}</td>
                  <td>{item.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {module.id === "cost" && layer?.expenses && (
        <div className="expense-list">
          <div className="expense-head">
            <span>费用项目</span>
            <span>占收入</span>
            <span>同比</span>
            <span>占比变化</span>
          </div>
          {layer.expenses.map((expense) => (
            <div className="expense-row" key={expense.name}>
              <div>
                <strong>{expense.name}</strong>
                <small>
                  {expense.value} {expense.unit}
                </small>
              </div>
              <div className="bar-cell">
                <span>
                  <i
                    style={{
                      width: `${Math.min(expense.revenueShare * 2.8, 100)}%`,
                    }}
                  />
                </span>
                <strong>{expense.revenueShare}%</strong>
              </div>
              <span>{formatSigned(expense.yoy, "%")}</span>
              <span>{formatSigned(expense.shareChangePp, "pp")}</span>
            </div>
          ))}
        </div>
      )}

      {module.id === "balance" && layer && (
        <div className="evidence-gap">
          <div>
            <span>{layer.dataStatus ?? "待补充"}</span>
            <h4>证据不足时，结论保持为空。</h4>
            <p>
              资产负债与现金流必须回到原始公告核对，不能用利润表趋势代替。
            </p>
          </div>
          <ul>
            {(layer.watchItems ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {module.id === "management" && layer?.signals && (
        <div className="signal-table">
          {layer.signals.map((signal) => (
            <div key={`${signal.speaker}-${signal.signal}`}>
              <span>{signal.speaker}</span>
              <strong>“{signal.signal}”</strong>
              <p>{signal.interpretation}</p>
            </div>
          ))}
        </div>
      )}

      {module.id === "competition" && layer?.competitors && (
        <div className="table-frame">
          <table>
            <thead>
              <tr>
                <th scope="col">对手</th>
                <th scope="col">动作</th>
                <th scope="col">影响</th>
                <th scope="col">期限</th>
              </tr>
            </thead>
            <tbody>
              {layer.competitors.map((competitor) => (
                <tr key={competitor.name}>
                  <th scope="row">{competitor.name}</th>
                  <td>{competitor.action}</td>
                  <td>{competitor.impact}</td>
                  <td>{competitor.horizon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {module.id === "external" && layer?.shocks && (
        <div className="shock-table">
          <div className="shock-head">
            <span>变量</span>
            <span>强度 / 方向</span>
            <span>财报痕迹</span>
            <span>下季映射</span>
          </div>
          {layer.shocks.map((shock) => (
            <div className="shock-row" key={shock.source}>
              <strong>{shock.source}</strong>
              <span>
                {shock.intensity} · {shock.direction}
              </span>
              <p>{shock.financialTrace}</p>
              <p>{shock.nextQuarter}</p>
            </div>
          ))}
        </div>
      )}

      {module.id === "market" && layer?.reaction && (
        <div className="market-grid">
          <div className="market-move">
            <span>财报当日</span>
            <strong>{formatSigned(layer.reaction.closePct, "%")}</strong>
            <small>
              盘中最大 {formatSigned(layer.reaction.intradayMaxPct, "%")}
            </small>
          </div>
          <div>
            <span className="list-label positive-label">市场在奖励</span>
            <ul>
              {layer.reaction.bullFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="list-label negative-label">市场仍担心</span>
            <ul>
              {layer.reaction.bearFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {module.id === "scenario" && (
        <div className="scenario-module">
          <ScenarioTable scenarios={data.scenarios} />
          <div className="watchlist-grid">
            {(layer?.watchlist ?? []).map((item, index) => (
              <div key={item.metric}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h4>{item.metric}</h4>
                <strong>{item.target}</strong>
                <p>{item.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {module.id === "memo" && (
        <div className="memo-grid">
          <div className="memo-rating">
            <span>当前研究判断</span>
            <strong>{data.thesis.rating}</strong>
            <div
              className="confidence-scale"
              aria-label={`研究信心 ${data.thesis.stars} / 5`}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <i
                  className={index < data.thesis.stars ? "is-filled" : ""}
                  key={index}
                />
              ))}
            </div>
            <p>{data.thesis.valuationContext}</p>
          </div>
          <div className="memo-core">
            <span>核心矛盾</span>
            <p>{data.thesis.coreConflict}</p>
            <span>可证伪信号</span>
            <strong>{data.thesis.falsifiableSignal}</strong>
          </div>
          <EventList title="催化剂" tone="positive" items={data.catalysts} />
          <EventList title="风险" tone="negative" items={data.risks} />
        </div>
      )}
    </article>
  );
}

function EventList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "positive" | "negative";
  items: ReportData["catalysts"];
}) {
  return (
    <div className="event-list">
      <span className={`list-label ${tone}-label`}>{title}</span>
      {items.map((item) => (
        <div key={item.event}>
          <strong>{item.event}</strong>
          <span>{item.impact}</span>
        </div>
      ))}
    </div>
  );
}

function ModuleDirectory({
  activeModule,
  data,
  onSelect,
}: {
  activeModule: ModuleId;
  data: ReportData;
  onSelect: (id: ModuleId) => void;
}) {
  function preview(module: ResearchModule) {
    if (module.id === "memo") return data.thesis.headline;
    return (
      data.analysisLayers.find((layer) => layer.id === module.sourceLayerId)
        ?.verdict ?? "等待数据接入"
    );
  }

  return (
    <div className="module-directory" aria-label="九模块研究框架">
      {MODULE_GROUPS.map((group) => (
        <section key={group} className="module-group">
          <div className="module-group-heading">
            <span>{group}</span>
            <small>
              {RESEARCH_MODULES.filter((module) => module.group === group)
                .map((module) => String(module.index).padStart(2, "0"))
                .join(" · ")}
            </small>
          </div>
          <div>
            {RESEARCH_MODULES.filter((module) => module.group === group).map(
              (module) => (
                <button
                  type="button"
                  className={
                    module.id === activeModule
                      ? "module-button is-active"
                      : "module-button"
                  }
                  key={module.id}
                  onClick={() => onSelect(module.id)}
                  aria-current={
                    module.id === activeModule ? "true" : undefined
                  }
                >
                  <span>{String(module.index).padStart(2, "0")}</span>
                  <span>
                    <strong>{module.title}</strong>
                    <small>{preview(module)}</small>
                  </span>
                </button>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function ReportOverview({ data }: { data: ReportData }) {
  const strategy = strategicSummary(data);

  return (
    <>
      <section className="report-hero" id="report-top">
        <div className="report-status-row">
          <span className="report-state">
            <i />
            最新已发布
          </span>
          <span>
            数据更新 {formatUpdatedAt(data.updatedAt)} · Schema{" "}
            {data.schemaVersion}
          </span>
        </div>
        <div className="report-title-row">
          <div>
            <div className="company-kicker">
              <span
                style={{ backgroundColor: data.company.brandColor }}
                aria-hidden="true"
              />
              {data.company.nameEn} · {data.company.ticker}
            </div>
            <h1>{data.report.title}</h1>
          </div>
          <dl className="report-facts">
            <div>
              <dt>报告期末</dt>
              <dd>{data.report.periodEnd}</dd>
            </div>
            <div>
              <dt>分析日期</dt>
              <dd>{data.report.analyzedAt}</dd>
            </div>
            <div>
              <dt>股价参考</dt>
              <dd>
                {data.thesis.priceAtAnalysis} {data.thesis.priceCurrency}
              </dd>
            </div>
            <div>
              <dt>市值参考</dt>
              <dd>
                {data.thesis.marketCap} {data.thesis.marketCapUnit}
              </dd>
            </div>
          </dl>
        </div>

        <section
          className="conclusion-summary"
          aria-labelledby="conclusion-summary-title"
        >
          <header className="conclusion-header">
            <div>
              <span>Operating outlook</span>
              <h2 id="conclusion-summary-title">经营难点与战略方向</h2>
              <p>通过财报识别企业卡在哪里，以及管理层准备把资源投向哪里。</p>
            </div>
            <div className="conclusion-rating">
              <span>研究判断</span>
              <strong>{data.thesis.rating}</strong>
              <div
                className="conclusion-score"
                aria-label={`研究信心 ${data.thesis.stars} / 5`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <i
                    className={index < data.thesis.stars ? "is-filled" : ""}
                    key={index}
                  />
                ))}
              </div>
              <small>{data.thesis.stars} / 5</small>
            </div>
          </header>

          <div className="strategy-thesis">
            <article>
              <span>当前最需要看清的难题</span>
              <p>{strategy.primaryDifficulty}</p>
            </article>
            <article>
              <span>战略判断</span>
              <p>{strategy.strategicJudgment}</p>
            </article>
          </div>

          <div className="strategy-ledger">
            <section aria-labelledby="current-challenges-title">
              <header>
                <span>企业目前卡在哪里</span>
                <h3 id="current-challenges-title">当前难点</h3>
              </header>
              <div>
                {strategy.currentChallenges.map((challenge) => (
                  <article key={challenge.title}>
                    <h4>{challenge.title}</h4>
                    <p>{challenge.evidence}</p>
                    <small>{challenge.implication}</small>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="future-directions-title">
              <header>
                <span>管理层准备往哪里走</span>
                <h3 id="future-directions-title">未来战略方向</h3>
              </header>
              <div>
                {strategy.futureDirections.map((direction) => (
                  <article key={direction.title}>
                    <h4>{direction.title}</h4>
                    <p>{direction.rationale}</p>
                    <dl>
                      <div>
                        <dt>管理层信号</dt>
                        <dd>{direction.managementSignal}</dd>
                      </div>
                      <div>
                        <dt>验证指标</dt>
                        <dd>{direction.validation}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="strategy-boundary">
            <article>
              <span>财报给出的核心矛盾</span>
              <p>{data.thesis.coreConflict}</p>
            </article>
            <article>
              <span>什么会推翻当前判断</span>
              <p>{data.thesis.falsifiableSignal}</p>
            </article>
            <article>
              <span>市场定价语境</span>
              <p>{data.thesis.valuationContext}</p>
            </article>
          </div>
        </section>
      </section>

      <section className="overview-section" aria-labelledby="snapshot-title">
        <div className="section-title">
          <div>
            <span>Overview</span>
            <h2 id="snapshot-title">财务快照</h2>
          </div>
          <p>统一比较实际值、趋势、市场预期和研究判断。</p>
        </div>
        <MetricTable metrics={data.keyMetrics} />
      </section>

      <section className="overview-section" aria-labelledby="segments-title">
        <div className="section-title compact-title">
          <div>
            <span>Segments</span>
            <h2 id="segments-title">分部经济性</h2>
          </div>
          <p>{data.revenuePresentation.description}</p>
        </div>
        <div className="table-frame">
          <table className="segment-table">
            <thead>
              <tr>
                <th scope="col">分部</th>
                <th scope="col">收入</th>
                <th scope="col">收入同比</th>
                <th scope="col">经营利润 / 亏损</th>
                <th scope="col">利润率</th>
                <th scope="col">研究摘要</th>
              </tr>
            </thead>
            <tbody>
              {data.segments.map((segment) => (
                <tr key={segment.id}>
                  <th scope="row">{segment.name}</th>
                  <td>
                    {segment.revenue} {segment.revenueUnit}
                  </td>
                  <td>{formatSigned(segment.revenueYoy, "%")}</td>
                  <td
                    className={
                      segment.operatingProfit < 0
                        ? "negative-number"
                        : "positive-number"
                    }
                  >
                    {formatSigned(segment.operatingProfit)}{" "}
                    {segment.operatingProfitUnit}
                  </td>
                  <td>{formatSigned(segment.margin, "%")}</td>
                  <td className="summary-cell">{segment.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="accounting-note">
          <span>口径变更</span>
          <div>
            {data.revenuePresentation.items.map((item) => (
              <p key={item.name}>
                <strong>{item.name}</strong>
                {item.detail}
                {typeof item.value === "number" && (
                  <em>
                    {item.value} {item.unit} · 同比{" "}
                    {formatSigned(item.yoy ?? 0, "%")}
                  </em>
                )}
                {typeof item.value !== "number" &&
                  typeof item.yoy === "number" && (
                    <em>同比 {formatSigned(item.yoy, "%")}</em>
                  )}
              </p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function MethodAndSources({ data }: { data: ReportData }) {
  return (
    <>
      <section className="method-section" id="method">
        <div className="section-title">
          <div>
            <span>Method</span>
            <h2>研究方法</h2>
          </div>
          <p>{data.methodology.name}</p>
        </div>
        <div className="method-grid">
          <div className="principle-list">
            {data.methodology.principles.map((principle, index) => (
              <div key={principle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{principle}</p>
              </div>
            ))}
          </div>
          <ol className="workflow-list">
            {data.methodology.workflow.map((item) => (
              <li key={item.step}>
                <span>{String(item.step).padStart(2, "0")}</span>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sources-section" id="sources">
        <div className="section-title compact-title">
          <div>
            <span>Evidence</span>
            <h2>来源与边界</h2>
          </div>
          <p>{data.report.disclaimer}</p>
        </div>
        <div className="source-list">
          {data.sources.map((source, index) => (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              key={source.url}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{source.title}</strong>
              <SourceType type={source.type} />
              <ArrowUpRightIcon />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function LoadingReport() {
  return (
    <div className="loading-report" role="status" aria-live="polite">
      <div className="loading-heading">
        <span className="skeleton skeleton-short" />
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-copy" />
      </div>
      <p>正在连接财报数据服务器</p>
      <div className="loading-table">
        {Array.from({ length: 6 }, (_, index) => (
          <span className="skeleton" key={index} />
        ))}
      </div>
    </div>
  );
}

function ErrorReport({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <span>数据连接失败</span>
      <h1>财报暂时没有加载出来。</h1>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        重新连接
      </button>
    </div>
  );
}

export default function Home() {
  const defaultReport = getDefaultReport();
  const [selectedReportId, setSelectedReportId] = useState(defaultReport.id);
  const [activeModule, setActiveModule] = useState<ModuleId>("business");
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const selectedReport =
    PUBLISHED_REPORTS.find((report) => report.id === selectedReportId) ??
    defaultReport;

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      setData(null);
      setError("");
      try {
        const response = await fetch(selectedReport.endpoint, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`数据服务返回 ${response.status}`);
        }
        const report = (await response.json()) as ReportData;
        setData(report);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "数据加载失败");
      }
    }

    loadReport();
    return () => controller.abort();
  }, [reloadKey, selectedReport]);

  const activeResearchModule = useMemo(
    () =>
      RESEARCH_MODULES.find((module) => module.id === activeModule) ??
      RESEARCH_MODULES[0],
    [activeModule],
  );

  function chooseReport(id: string) {
    setSelectedReportId(id);
    setActiveModule("business");
    const url = new URL(window.location.href);
    url.searchParams.set("report", id);
    window.history.replaceState({}, "", url);
  }

  return (
    <div className="app-shell">
      <AppHeader
        selectedReport={selectedReport}
        onSelectReport={chooseReport}
        sourceUrl={data?.sources[0]?.url}
      />
      <div className="workspace">
        <ResearchLibrary
          selectedReport={selectedReport}
          onSelectReport={chooseReport}
        />
        <main className="report-page">
          {error ? (
            <ErrorReport
              message={error}
              onRetry={() => setReloadKey((value) => value + 1)}
            />
          ) : !data ? (
            <LoadingReport />
          ) : (
            <>
              <ReportOverview data={data} />

              <section
                className="research-section"
                id="research-framework"
                aria-labelledby="research-title"
              >
                <div className="section-title">
                  <div>
                    <span>Research framework</span>
                    <h2 id="research-title">九模块研究框架</h2>
                  </div>
                  <p>
                    三组证据链：先确认事实，再解释经营，最后形成可证伪判断。
                  </p>
                </div>
                <ModuleDirectory
                  activeModule={activeModule}
                  data={data}
                  onSelect={setActiveModule}
                />
                <LayerContent module={activeResearchModule} data={data} />
              </section>

              <MethodAndSources data={data} />

              <footer className="report-footer">
                <div>
                  <span className="product-mark" aria-hidden="true">
                    SR
                  </span>
                  <p>
                    思航研究 · 用结构化证据跟踪公司经营，而不是追逐单季情绪。
                  </p>
                </div>
                <a href="#report-top">回到顶部 ↑</a>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
