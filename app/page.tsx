"use client";

import { useEffect, useMemo, useState } from "react";

const DATA_ENDPOINT =
  process.env.NEXT_PUBLIC_FINANCIAL_DATA_URL ??
  "https://82.157.208.201/financial-data/meituan-2026-q1.json";

type Tone = "positive" | "negative" | "neutral";

type KeyMetric = {
  id: string;
  label: string;
  value: number;
  unit: string;
  yoy?: number;
  yoyText?: string;
  qoqText?: string;
  consensus?: number;
  consensusUnit?: string;
  result: string;
  tone: Tone;
};

type Segment = {
  id: string;
  name: string;
  revenue: number;
  revenueUnit: string;
  revenueYoy: number;
  operatingProfit: number;
  operatingProfitUnit: string;
  priorYearOperatingProfit: number;
  priorQuarterOperatingProfit: number;
  margin: number;
  priorYearMargin: number;
  summary: string;
};

type Expense = {
  name: string;
  value: number;
  unit: string;
  yoy: number;
  revenueShare: number;
  shareChangePp: number;
};

type BusinessItem = {
  name: string;
  volume: string;
  price: string;
  effect: string;
};

type Signal = {
  speaker: string;
  signal: string;
  interpretation: string;
};

type Competitor = {
  name: string;
  action: string;
  impact: string;
  horizon: string;
};

type Shock = {
  source: string;
  intensity: string;
  direction: string;
  financialTrace: string;
  nextQuarter: string;
};

type WatchItem = {
  metric: string;
  target: string;
  why: string;
};

type AnalysisLayer = {
  id: string;
  index: number;
  title: string;
  question: string;
  verdict: string;
  items?: BusinessItem[];
  expenses?: Expense[];
  dataStatus?: string;
  watchItems?: string[] | WatchItem[];
  signals?: Signal[];
  competitors?: Competitor[];
  shocks?: Shock[];
  reaction?: {
    intradayMaxPct: number;
    closePct: number;
    bullFactors: string[];
    bearFactors: string[];
  };
};

type Scenario = {
  id: string;
  name: string;
  probability: number;
  tone: Tone;
  triggers: string[];
  coreLocalProfitRange: [number, number];
  adjustedNetProfitRange: [number, number];
  unit: string;
};

type EventItem = {
  event: string;
  impact: string;
};

type ReportData = {
  schemaVersion: string;
  slug: string;
  updatedAt: string;
  company: {
    name: string;
    nameEn: string;
    ticker: string;
    adrTicker: string;
    brandColor: string;
  };
  report: {
    title: string;
    period: string;
    periodEnd: string;
    publishedAt: string;
    analyzedAt: string;
    analysts: string[];
    framework: string;
    disclaimer: string;
  };
  thesis: {
    rating: string;
    stars: number;
    headline: string;
    coreConflict: string;
    falsifiableSignal: string;
    priceAtAnalysis: number;
    priceCurrency: string;
    marketCap: number;
    marketCapUnit: string;
    valuationContext: string;
  };
  keyMetrics: KeyMetric[];
  segments: Segment[];
  revenuePresentation: {
    changed: boolean;
    description: string;
    items: Array<{
      name: string;
      detail: string;
      value?: number;
      unit?: string;
      yoy?: number;
    }>;
  };
  analysisLayers: AnalysisLayer[];
  scenarios: Scenario[];
  catalysts: EventItem[];
  risks: EventItem[];
  methodology: {
    name: string;
    principles: string[];
    workflow: Array<{
      step: number;
      name: string;
      description: string;
    }>;
  };
  sources: Array<{
    type: string;
    title: string;
    url: string;
  }>;
};

function formatSigned(value: number, suffix = "") {
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

function formatRange(range: [number, number], unit: string) {
  return `${formatSigned(range[0])} ～ ${formatSigned(range[1])} ${unit}`;
}

function metricContext(metric: KeyMetric) {
  if (metric.qoqText) return metric.qoqText;
  if (metric.yoyText) return metric.yoyText;
  if (typeof metric.yoy === "number") {
    return `同比 ${formatSigned(metric.yoy, "%")}`;
  }
  return "";
}

function toneLabel(tone: Tone) {
  if (tone === "positive") return "正面";
  if (tone === "negative") return "承压";
  return "观察";
}

export default function Home() {
  const [data, setData] = useState<ReportData | null>(null);
  const [activeLayer, setActiveLayer] = useState("business");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      setError("");
      try {
        const response = await fetch(DATA_ENDPOINT, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`数据服务返回 ${response.status}`);
        }
        const report = (await response.json()) as ReportData;
        setData(report);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "数据加载失败");
      }
    }

    loadReport();
    return () => controller.abort();
  }, [reloadKey]);

  const layer = useMemo(
    () => data?.analysisLayers.find((item) => item.id === activeLayer),
    [activeLayer, data],
  );

  if (!data) {
    return (
      <main className="loading-page">
        <div className="loading-shell">
          <div className="loading-brand">
            <span className="brand-symbol" aria-hidden="true">MT</span>
            <span>思航研究</span>
          </div>
          {error ? (
            <div className="error-card">
              <p className="eyebrow">DATA CONNECTION</p>
              <h1>财报数据暂时没有加载出来。</h1>
              <p>{error}</p>
              <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
                重新连接
              </button>
            </div>
          ) : (
            <div className="loader-card" role="status" aria-live="polite">
              <span className="loader-dot" />
              <div>
                <p>正在连接财报数据服务器</p>
                <small>MEITUAN · 2026 Q1</small>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header">
        <div className="container nav-shell">
          <a className="brand" href="#overview" aria-label="返回美团财报概览">
            <span className="brand-symbol" aria-hidden="true">MT</span>
            <span className="brand-copy">
              <strong>思航研究</strong>
              <small>MEITUAN EARNINGS</small>
            </span>
          </a>
          <nav className="main-nav" aria-label="报告导航">
            <a href="#overview">概览</a>
            <a href="#layers">八层分析</a>
            <a href="#scenarios">情景推演</a>
            <a href="#method">方法</a>
          </nav>
          <a
            className="source-link"
            href={data.sources[0]?.url}
            target="_blank"
            rel="noreferrer"
          >
            财报原文 <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <section className="hero" id="overview">
        <div className="container">
          <div className="hero-status">
            <span className="live-dot" />
            REMOTE DATA · SCHEMA {data.schemaVersion}
          </div>
          <div className="hero-grid">
            <div className="hero-main">
              <p className="eyebrow">{data.company.ticker} · {data.report.period}</p>
              <h1>美团 2026 Q1<br />财报深度分析</h1>
              <p className="hero-summary">{data.thesis.headline}</p>
            </div>
            <aside className="signal-panel">
              <div className="signal-topline">
                <span>投资信号</span>
                <span>{data.thesis.stars} / 5</span>
              </div>
              <div className="rating-row">
                <strong>{data.thesis.rating}</strong>
                <div className="stars" aria-label={`${data.thesis.stars} 星`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <i className={index < data.thesis.stars ? "is-filled" : ""} key={index} />
                  ))}
                </div>
              </div>
              <p>{data.thesis.coreConflict}</p>
              <div className="proof-box">
                <span>最关键的可证伪信号</span>
                <strong>{data.thesis.falsifiableSignal}</strong>
              </div>
            </aside>
          </div>

          <div className="hero-meta">
            <span>报告发布 {data.report.publishedAt}</span>
            <span>分析日期 {data.report.analyzedAt}</span>
            <span>分析师 {data.report.analysts.join(" + ")}</span>
            <span>数据更新 {new Date(data.updatedAt).toLocaleString("zh-CN", { hour12: false })}</span>
          </div>
        </div>
      </section>

      <section className="metrics-section container" aria-labelledby="metrics-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FINANCIAL SNAPSHOT</p>
            <h2 id="metrics-title">关键数字</h2>
          </div>
          <p>实际值、预期差与趋势放在同一张卡片上</p>
        </div>
        <div className="metric-grid">
          {data.keyMetrics.map((metric, index) => (
            <article className="metric-card" key={metric.id}>
              <div className="metric-topline">
                <span>0{index + 1}</span>
                <span className={`tone-pill tone-${metric.tone}`}>
                  {toneLabel(metric.tone)}
                </span>
              </div>
              <div>
                <p>{metric.label}</p>
                <strong>
                  {metric.value}
                  <small>{metric.unit}</small>
                </strong>
              </div>
              <div className="metric-bottom">
                <span>{metricContext(metric)}</span>
                {typeof metric.consensus === "number" && (
                  <span>市场预估 {metric.consensus} {metric.consensusUnit}</span>
                )}
                <b>{metric.result}</b>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="segment-section">
        <div className="container">
          <div className="section-heading inverted-heading">
            <div>
              <p className="eyebrow">SEGMENT ECONOMICS</p>
              <h2>同一份财报里的两种温度</h2>
            </div>
            <p>核心业务利润塌陷，新业务增长与减亏并行</p>
          </div>
          <div className="segment-grid">
            {data.segments.map((segment) => {
              const qoqImprovement =
                segment.operatingProfit - segment.priorQuarterOperatingProfit;
              return (
                <article className="segment-card" key={segment.id}>
                  <div className="segment-title">
                    <div>
                      <span>{segment.name}</span>
                      <small>收入 {segment.revenue} {segment.revenueUnit}</small>
                    </div>
                    <strong>{formatSigned(segment.revenueYoy, "%")}</strong>
                  </div>
                  <div className="segment-profit">
                    <span>经营利润 / 亏损</span>
                    <strong>{formatSigned(segment.operatingProfit)} {segment.operatingProfitUnit}</strong>
                  </div>
                  <div className="margin-track" aria-label={`${segment.name}利润率变化`}>
                    <div>
                      <span>去年同期 {formatSigned(segment.priorYearMargin, "%")}</span>
                      <span>本期 {formatSigned(segment.margin, "%")}</span>
                    </div>
                    <i>
                      <b style={{ width: `${Math.min(Math.abs(segment.margin) * 3.5 + 12, 100)}%` }} />
                    </i>
                  </div>
                  <p>{segment.summary}</p>
                  <div className="qoq-badge">
                    环比改善 <strong>{qoqImprovement} 亿元</strong>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="presentation-note">
            <span className="note-number">口径变更</span>
            <div>
              <h3>{data.revenuePresentation.description}</h3>
              <div className="presentation-items">
                {data.revenuePresentation.items.map((item) => (
                  <article key={item.name}>
                    <strong>{item.name}</strong>
                    <p>{item.detail}</p>
                    {typeof item.value === "number" && (
                      <span>{item.value} {item.unit} · 同比 {formatSigned(item.yoy ?? 0, "%")}</span>
                    )}
                    {typeof item.value !== "number" && typeof item.yoy === "number" && (
                      <span>同比 {formatSigned(item.yoy, "%")}</span>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="layers-section container" id="layers">
        <div className="section-heading">
          <div>
            <p className="eyebrow">8-LAYER FRAMEWORK</p>
            <h2>从数字到判断</h2>
          </div>
          <p>不是复述财报，而是逐层定位驱动、风险与验证条件</p>
        </div>

        <div className="layer-workbench">
          <nav className="layer-nav" aria-label="八层分析框架">
            {data.analysisLayers.map((item) => (
              <button
                className={item.id === activeLayer ? "is-active" : ""}
                key={item.id}
                type="button"
                onClick={() => setActiveLayer(item.id)}
              >
                <span>0{item.index}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
          </nav>

          {layer && (
            <article className="layer-content" key={layer.id}>
              <div className="layer-intro">
                <div>
                  <span>0{layer.index}</span>
                  <p>{layer.question}</p>
                </div>
                <h3>{layer.title}</h3>
              </div>
              <div className="verdict-card">
                <span>本层结论</span>
                <p>{layer.verdict}</p>
              </div>

              {layer.items && (
                <div className="data-table business-table">
                  <div className="data-row data-head">
                    <span>业务</span><span>量</span><span>价 / 货币化</span><span>净效果</span>
                  </div>
                  {layer.items.map((item) => (
                    <div className="data-row" key={item.name}>
                      <strong>{item.name}</strong>
                      <span>{item.volume}</span>
                      <span>{item.price}</span>
                      <span>{item.effect}</span>
                    </div>
                  ))}
                </div>
              )}

              {layer.expenses && (
                <div className="expense-list">
                  {layer.expenses.map((expense) => (
                    <div className="expense-row" key={expense.name}>
                      <div className="expense-label">
                        <strong>{expense.name}</strong>
                        <span>{expense.value} {expense.unit}</span>
                      </div>
                      <div className="expense-bar">
                        <i style={{ width: `${Math.min(expense.revenueShare, 100)}%` }} />
                      </div>
                      <div className="expense-metrics">
                        <span>占收入 {expense.revenueShare}%</span>
                        <b>同比 {formatSigned(expense.yoy, "%")}</b>
                        <em>{formatSigned(expense.shareChangePp, "pp")}</em>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {layer.dataStatus && (
                <div className="data-gap">
                  <span>{layer.dataStatus}</span>
                  <h4>不拿推断冒充财务事实</h4>
                  <ul>
                    {(layer.watchItems as string[]).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              )}

              {layer.signals && (
                <div className="signal-list">
                  {layer.signals.map((item) => (
                    <article key={`${item.speaker}-${item.signal}`}>
                      <span>{item.speaker}</span>
                      <strong>“{item.signal}”</strong>
                      <p>{item.interpretation}</p>
                    </article>
                  ))}
                </div>
              )}

              {layer.competitors && (
                <div className="data-table competitor-table">
                  <div className="data-row data-head">
                    <span>对手</span><span>动作</span><span>影响</span><span>期限</span>
                  </div>
                  {layer.competitors.map((item) => (
                    <div className="data-row" key={item.name}>
                      <strong>{item.name}</strong>
                      <span>{item.action}</span>
                      <span>{item.impact}</span>
                      <b>{item.horizon}</b>
                    </div>
                  ))}
                </div>
              )}

              {layer.shocks && (
                <div className="shock-list">
                  {layer.shocks.map((shock) => (
                    <article key={shock.source}>
                      <div className="shock-title">
                        <strong>{shock.source}</strong>
                        <span>{shock.intensity}</span>
                        <b>{shock.direction}</b>
                      </div>
                      <p><span>财报痕迹</span>{shock.financialTrace}</p>
                      <p><span>Q2 映射</span>{shock.nextQuarter}</p>
                    </article>
                  ))}
                </div>
              )}

              {layer.reaction && (
                <div className="reaction-grid">
                  <div className="reaction-summary">
                    <span>财报当日</span>
                    <strong>收盘 +{layer.reaction.closePct}%</strong>
                    <small>盘中最大 +{layer.reaction.intradayMaxPct}%</small>
                  </div>
                  <div className="factor-card factor-bull">
                    <span>市场在奖励什么</span>
                    <ul>{layer.reaction.bullFactors.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div className="factor-card factor-bear">
                    <span>市场仍担心什么</span>
                    <ul>{layer.reaction.bearFactors.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                </div>
              )}

              {layer.id === "future" && (
                <div className="watch-grid">
                  {(layer.watchItems as WatchItem[]).map((item, index) => (
                    <article key={item.metric}>
                      <span>0{index + 1}</span>
                      <h4>{item.metric}</h4>
                      <strong>{item.target}</strong>
                      <p>{item.why}</p>
                    </article>
                  ))}
                </div>
              )}
            </article>
          )}
        </div>
      </section>

      <section className="scenario-section" id="scenarios">
        <div className="container">
          <div className="section-heading scenario-heading">
            <div>
              <p className="eyebrow">Q2 SCENARIO ENGINE</p>
              <h2>把判断写成概率</h2>
            </div>
            <p>基准情景占 50%，结论随竞争与监管信号更新</p>
          </div>

          <div className="scenario-grid">
            {data.scenarios.map((scenario) => (
              <article className={`scenario-card scenario-${scenario.tone}`} key={scenario.id}>
                <div className="scenario-topline">
                  <span>{scenario.name}情景</span>
                  <strong>{scenario.probability}%</strong>
                </div>
                <div className="probability-track">
                  <i style={{ width: `${scenario.probability}%` }} />
                </div>
                <ul>
                  {scenario.triggers.map((trigger) => <li key={trigger}>{trigger}</li>)}
                </ul>
                <dl>
                  <div>
                    <dt>核心本地商业经营利润</dt>
                    <dd>{formatRange(scenario.coreLocalProfitRange, scenario.unit)}</dd>
                  </div>
                  <div>
                    <dt>集团经调整净利润</dt>
                    <dd>{formatRange(scenario.adjustedNetProfitRange, scenario.unit)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="events-grid">
            <article>
              <span className="event-label event-positive">催化剂</span>
              {data.catalysts.map((item) => (
                <div className="event-row" key={item.event}>
                  <strong>{item.event}</strong><span>{item.impact}</span>
                </div>
              ))}
            </article>
            <article>
              <span className="event-label event-negative">风险</span>
              {data.risks.map((item) => (
                <div className="event-row" key={item.event}>
                  <strong>{item.event}</strong><span>{item.impact}</span>
                </div>
              ))}
            </article>
          </div>
        </div>
      </section>

      <section className="method-section container" id="method">
        <div className="method-intro">
          <p className="eyebrow">RESEARCH METHOD</p>
          <h2>{data.methodology.name}</h2>
          <p>这套方法的核心，是把“财报事实—经营解释—外部变量—未来验证”连成一条证据链。</p>
        </div>
        <div className="principle-list">
          {data.methodology.principles.map((principle, index) => (
            <div key={principle}>
              <span>0{index + 1}</span>
              <p>{principle}</p>
            </div>
          ))}
        </div>
        <div className="workflow-grid">
          {data.methodology.workflow.map((item) => (
            <article key={item.step}>
              <span>{String(item.step).padStart(2, "0")}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sources-section">
        <div className="container">
          <div className="sources-heading">
            <div>
              <p className="eyebrow">SOURCE TRAIL</p>
              <h2>来源与边界</h2>
            </div>
            <p>{data.report.disclaimer}</p>
          </div>
          <div className="source-list">
            {data.sources.map((source, index) => (
              <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{source.title}</strong>
                <small>{source.type}</small>
                <b aria-hidden="true">↗</b>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div>
            <span className="brand-symbol footer-symbol" aria-hidden="true">MT</span>
            <div>
              <strong>思航研究</strong>
              <p>用可证伪的框架，理解公司经营变化。</p>
            </div>
          </div>
          <div>
            <p>Data served from 82.157.208.201</p>
            <a href="#overview">回到顶部 ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
