"use client";

import { useMemo, useState } from "react";

type Region = "中国" | "全球";
type SortKey = "score" | "growth" | "margin" | "cash";

type Company = {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  region: Region;
  currency: string;
  period: string;
  revenue: number;
  growth: number;
  profit: number;
  margin: number;
  cash: number;
  cashRatio: number;
  roe: number;
  score: number;
  color: string;
  summary: string;
  signal: string;
  risk: string;
  trend: number[];
  labels: string[];
};

const companies: Company[] = [
  {
    id: "nvidia",
    name: "NVIDIA",
    ticker: "NVDA",
    sector: "半导体",
    region: "全球",
    currency: "USD",
    period: "FY2025",
    revenue: 130.5,
    growth: 114.2,
    profit: 72.9,
    margin: 55.9,
    cash: 64.1,
    cashRatio: 87.9,
    roe: 119.2,
    score: 94,
    color: "#75c57c",
    summary: "数据中心需求推动收入与利润同步跃升，规模效应继续放大盈利能力。",
    signal: "增长、毛利率与现金创造能力形成共振，经营质量处于样本首位。",
    risk: "客户集中度与资本开支周期较高，需持续跟踪云厂商投资节奏。",
    trend: [27.0, 27.0, 60.9, 130.5],
    labels: ["FY22", "FY23", "FY24", "FY25"],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    ticker: "MSFT",
    sector: "软件与云",
    region: "全球",
    currency: "USD",
    period: "FY2025",
    revenue: 281.7,
    growth: 14.9,
    profit: 101.8,
    margin: 36.1,
    cash: 136.2,
    cashRatio: 133.8,
    roe: 32.7,
    score: 92,
    color: "#6958f6",
    summary: "Azure 与 AI 服务保持双位数增长，订阅型收入提升了业绩可见度。",
    signal: "高净利率与强经营现金流兼备，盈利韧性在大型科技公司中领先。",
    risk: "AI 基础设施投入抬升折旧压力，短期自由现金流增速可能低于收入。",
    trend: [198.3, 211.9, 245.1, 281.7],
    labels: ["FY22", "FY23", "FY24", "FY25"],
  },
  {
    id: "tencent",
    name: "腾讯控股",
    ticker: "0700.HK",
    sector: "互联网",
    region: "中国",
    currency: "RMB",
    period: "FY2024",
    revenue: 660.3,
    growth: 8.4,
    profit: 194.1,
    margin: 29.4,
    cash: 226.0,
    cashRatio: 116.4,
    roe: 21.6,
    score: 91,
    color: "#1689f5",
    summary: "高毛利业务占比提升，广告、视频号与小游戏推动利润增速快于收入。",
    signal: "成本纪律改善后，经营杠杆持续释放，现金回报能力显著增强。",
    risk: "游戏新品周期与宏观广告需求仍会影响季度增长的稳定性。",
    trend: [554.6, 554.6, 609.0, 660.3],
    labels: ["2021", "2022", "2023", "2024"],
  },
  {
    id: "apple",
    name: "Apple",
    ticker: "AAPL",
    sector: "消费电子",
    region: "全球",
    currency: "USD",
    period: "FY2024",
    revenue: 391.0,
    growth: 2.0,
    profit: 93.7,
    margin: 24.0,
    cash: 118.3,
    cashRatio: 126.3,
    roe: 157.4,
    score: 88,
    color: "#111111",
    summary: "硬件收入进入成熟期，服务业务继续提升整体毛利率与现金流质量。",
    signal: "现金转化能力突出，庞大装机基础为服务收入提供持续复利。",
    risk: "增长依赖产品升级周期，区域需求与供应链变化带来不确定性。",
    trend: [394.3, 383.3, 383.3, 391.0],
    labels: ["FY21", "FY22", "FY23", "FY24"],
  },
  {
    id: "meituan",
    name: "美团",
    ticker: "3690.HK",
    sector: "本地生活",
    region: "中国",
    currency: "RMB",
    period: "FY2024",
    revenue: 337.6,
    growth: 22.0,
    profit: 35.8,
    margin: 10.6,
    cash: 57.4,
    cashRatio: 160.3,
    roe: 18.5,
    score: 86,
    color: "#ffd000",
    summary: "核心本地商业保持增长，新业务减亏使利润释放明显快于收入。",
    signal: "利润拐点已经得到现金流验证，业务组合正从扩张转向效率。",
    risk: "即时零售竞争与骑手保障投入可能重新压缩核心业务利润率。",
    trend: [179.1, 220.0, 276.7, 337.6],
    labels: ["2021", "2022", "2023", "2024"],
  },
  {
    id: "amazon",
    name: "Amazon",
    ticker: "AMZN",
    sector: "电商与云",
    region: "全球",
    currency: "USD",
    period: "FY2024",
    revenue: 638.0,
    growth: 11.0,
    profit: 59.2,
    margin: 9.3,
    cash: 115.9,
    cashRatio: 195.8,
    roe: 24.7,
    score: 85,
    color: "#ff9900",
    summary: "AWS 增速回升与履约网络效率改善，共同带动营业利润创新高。",
    signal: "零售利润率修复叠加云业务增长，现金创造能力明显好于净利润。",
    risk: "资本开支快速增长，AI 基础设施回报周期仍需后续收入验证。",
    trend: [469.8, 514.0, 574.8, 638.0],
    labels: ["2021", "2022", "2023", "2024"],
  },
  {
    id: "alibaba",
    name: "阿里巴巴",
    ticker: "BABA",
    sector: "电商与云",
    region: "中国",
    currency: "RMB",
    period: "FY2025",
    revenue: 996.3,
    growth: 5.9,
    profit: 125.9,
    margin: 12.6,
    cash: 163.5,
    cashRatio: 129.9,
    roe: 8.1,
    score: 80,
    color: "#ff6a00",
    summary: "电商用户投入重新拉动增长，云业务受 AI 产品需求推动开始加速。",
    signal: "资产负债表稳健、现金流充裕，增长再投资具备较大缓冲空间。",
    risk: "电商竞争投入会压制短期利润，云业务加速尚需更多季度验证。",
    trend: [853.1, 868.7, 941.2, 996.3],
    labels: ["FY22", "FY23", "FY24", "FY25"],
  },
];

const highlights = [
  { label: "增长最快", value: "NVIDIA", metric: "+114.2%", note: "收入同比增长" },
  { label: "盈利效率", value: "Microsoft", metric: "36.1%", note: "净利率" },
  { label: "现金转化", value: "Amazon", metric: "195.8%", note: "经营现金 / 净利润" },
  { label: "综合质量", value: "NVIDIA", metric: "94 / 100", note: "财报质量评分" },
];

const sortLabels: Record<SortKey, string> = {
  score: "综合评分",
  growth: "营收增速",
  margin: "净利率",
  cash: "现金转化",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<"全部" | Region>("全部");
  const [sector, setSector] = useState("全部行业");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [selectedId, setSelectedId] = useState("nvidia");

  const sectors = useMemo(
    () => ["全部行业", ...Array.from(new Set(companies.map((company) => company.sector)))],
    [],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return companies
      .filter((company) => {
        const matchesQuery =
          !normalizedQuery ||
          company.name.toLowerCase().includes(normalizedQuery) ||
          company.ticker.toLowerCase().includes(normalizedQuery) ||
          company.sector.toLowerCase().includes(normalizedQuery);
        const matchesRegion = region === "全部" || company.region === region;
        const matchesSector = sector === "全部行业" || company.sector === sector;
        return matchesQuery && matchesRegion && matchesSector;
      })
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [query, region, sector, sortKey]);

  const selected =
    companies.find((company) => company.id === selectedId) ?? companies[0];
  const maxTrend = Math.max(...selected.trend);

  return (
    <main>
      <header className="site-header">
        <div className="container nav-shell">
          <a className="brand" href="#top" aria-label="思航研究首页">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="brand-name">思航研究</span>
          </a>
          <nav className="main-nav" aria-label="主导航">
            <a className="nav-active" href="#leaderboard">财报分析</a>
            <a href="#method">方法说明</a>
          </nav>
          <a
            className="nav-profile"
            href="https://github.com/nevilaa"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="container">
          <div className="hero-grid">
            <div>
              <p className="overline">FINANCIAL REPORT ANALYSIS</p>
              <h1>财报分析排行榜</h1>
            </div>
            <div className="hero-copy">
              <p>
                用同一套框架比较增长、盈利与现金流，把冗长财报压缩成可判断的经营信号。
              </p>
              <p className="disclaimer">示例数据用于产品演示，不构成投资建议。</p>
            </div>
          </div>

          <div className="hero-actions">
            <a className="primary-link" href="#leaderboard">
              浏览全部公司 <span aria-hidden="true">↓</span>
            </a>
            <a className="quiet-link" href="#method">
              查看评分方法
            </a>
          </div>

          <div className="highlight-grid" aria-label="关键财报洞察">
            {highlights.map((item, index) => (
              <article className="highlight-card" key={item.label}>
                <div className="card-topline">
                  <span>{item.label}</span>
                  <span className="card-index">0{index + 1}</span>
                </div>
                <div>
                  <h2>{item.value}</h2>
                  <p className="highlight-metric">{item.metric}</p>
                </div>
                <p className="highlight-note">{item.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="leaderboard container" id="leaderboard">
        <div className="section-heading">
          <div>
            <p className="overline">COMPANY SCOREBOARD</p>
            <h2>公司财报对比</h2>
          </div>
          <p>{filtered.length} 家公司 · 最近完整财年</p>
        </div>

        <div className="filter-bar" aria-label="财报筛选器">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">搜索公司</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索公司、代码或行业"
            />
          </label>

          <div className="segmented" aria-label="地区筛选">
            {(["全部", "中国", "全球"] as const).map((item) => (
              <button
                className={region === item ? "is-active" : ""}
                key={item}
                onClick={() => setRegion(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <label className="select-box">
            <span className="sr-only">行业筛选</span>
            <select value={sector} onChange={(event) => setSector(event.target.value)}>
              {sectors.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="sort-strip" aria-label="排序方式">
          <span>排序</span>
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <button
              className={sortKey === key ? "is-active" : ""}
              key={key}
              onClick={() => setSortKey(key)}
              type="button"
            >
              {sortLabels[key]}
              {sortKey === key && <span aria-hidden="true"> ↓</span>}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>公司</th>
                <th>报告期</th>
                <th>营收</th>
                <th>同比增长</th>
                <th>净利润</th>
                <th>净利率</th>
                <th>现金转化</th>
                <th>ROE</th>
                <th>综合评分</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <tr
                  className={selected.id === company.id ? "is-selected" : ""}
                  key={company.id}
                  onClick={() => setSelectedId(company.id)}
                >
                  <td>
                    <button
                      className="company-cell"
                      type="button"
                      onClick={() => setSelectedId(company.id)}
                      aria-label={`查看 ${company.name} 财报解读`}
                    >
                      <span
                        className="company-logo"
                        style={{ background: company.color }}
                        aria-hidden="true"
                      >
                        {company.name.slice(0, 1)}
                      </span>
                      <span>
                        <strong>{company.name}</strong>
                        <small>{company.ticker} · {company.sector}</small>
                      </span>
                    </button>
                  </td>
                  <td>{company.period}</td>
                  <td>
                    <strong>{company.revenue.toFixed(1)}B</strong>
                    <small>{company.currency}</small>
                  </td>
                  <td>
                    <span className={company.growth >= 0 ? "positive" : "negative"}>
                      {company.growth >= 0 ? "+" : ""}
                      {company.growth.toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <strong>{company.profit.toFixed(1)}B</strong>
                    <small>{company.currency}</small>
                  </td>
                  <td>{company.margin.toFixed(1)}%</td>
                  <td>{company.cashRatio.toFixed(1)}%</td>
                  <td>{company.roe.toFixed(1)}%</td>
                  <td>
                    <div className="score-cell">
                      <span>{company.score}</span>
                      <i>
                        <b style={{ width: `${company.score}%` }} />
                      </i>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              <p>没有找到匹配的公司。</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setRegion("全部");
                  setSector("全部行业");
                }}
              >
                清除筛选
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="analysis-section" aria-live="polite">
        <div className="container">
          <div className="analysis-heading">
            <div className="selected-company">
              <span
                className="company-logo company-logo-large"
                style={{ background: selected.color }}
                aria-hidden="true"
              >
                {selected.name.slice(0, 1)}
              </span>
              <div>
                <p className="overline">REPORT DEEP DIVE</p>
                <h2>{selected.name} · 财报解读</h2>
              </div>
            </div>
            <div className="quality-score">
              <span>经营质量评分</span>
              <strong>{selected.score}</strong>
              <small>/ 100</small>
            </div>
          </div>

          <div className="analysis-grid">
            <article className="trend-card">
              <div className="card-heading">
                <div>
                  <span>营收趋势</span>
                  <p>单位：十亿 {selected.currency}</p>
                </div>
                <strong>+{selected.growth.toFixed(1)}%</strong>
              </div>
              <div className="bar-chart" aria-label={`${selected.name}四年营收趋势`}>
                {selected.trend.map((value, index) => (
                  <div className="bar-item" key={selected.labels[index]}>
                    <span>{value.toFixed(1)}</span>
                    <div className="bar-track">
                      <i style={{ height: `${Math.max((value / maxTrend) * 100, 12)}%` }} />
                    </div>
                    <small>{selected.labels[index]}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-card-title">
                <span>关键指标</span>
                <small>{selected.period}</small>
              </div>
              <dl>
                <div>
                  <dt>净利率</dt>
                  <dd>{selected.margin.toFixed(1)}%</dd>
                </div>
                <div>
                  <dt>经营现金流</dt>
                  <dd>{selected.cash.toFixed(1)}B</dd>
                </div>
                <div>
                  <dt>现金转化</dt>
                  <dd>{selected.cashRatio.toFixed(1)}%</dd>
                </div>
                <div>
                  <dt>ROE</dt>
                  <dd>{selected.roe.toFixed(1)}%</dd>
                </div>
              </dl>
            </article>

            <article className="narrative-card">
              <div className="narrative-label">一句话结论</div>
              <p className="narrative-lead">{selected.summary}</p>
              <div className="narrative-row">
                <span className="signal-dot signal-dot-good" aria-hidden="true" />
                <div>
                  <h3>积极信号</h3>
                  <p>{selected.signal}</p>
                </div>
              </div>
              <div className="narrative-row">
                <span className="signal-dot signal-dot-risk" aria-hidden="true" />
                <div>
                  <h3>需要关注</h3>
                  <p>{selected.risk}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="method container" id="method">
        <div className="method-title">
          <p className="overline">METHODOLOGY</p>
          <h2>评分方法</h2>
        </div>
        <div className="method-grid">
          <article>
            <span>01</span>
            <h3>增长质量</h3>
            <p>比较收入增速、持续性与业务结构变化，避免只看单季波动。</p>
          </article>
          <article>
            <span>02</span>
            <h3>盈利能力</h3>
            <p>结合净利率、ROE 与经营杠杆，判断增长是否真正转化为利润。</p>
          </article>
          <article>
            <span>03</span>
            <h3>现金验证</h3>
            <p>用经营现金流对照净利润，识别会计利润与真实现金回报的差异。</p>
          </article>
          <article>
            <span>04</span>
            <h3>风险校正</h3>
            <p>关注周期、集中度、资本开支与竞争变化，对综合评分进行校正。</p>
          </article>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div>
            <span className="brand-name">思航研究</span>
            <p>把财报变成清晰、可比较的经营判断。</p>
          </div>
          <div className="footer-meta">
            <p>数据为演示用途 · 更新于 2026.07</p>
            <a href="#top">回到顶部 ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
