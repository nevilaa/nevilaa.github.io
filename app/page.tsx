"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Broadcast,
  ChartLineUp,
  FileText,
  Pulse,
} from "@phosphor-icons/react";
import { getDefaultReport } from "./report-catalog";

type RadarItem = {
  id?: string;
  title?: string;
  title_zh?: string;
  title_bilingual?: string;
  published_at?: string;
  ai_label?: string;
  aihot_category?: string;
};

type RadarSnapshot = {
  generated_at?: string;
  total_items?: number;
  items?: RadarItem[];
  items_ai?: RadarItem[];
};

const RADAR_DATA_URL = "/ai-radar/data/latest-24h.json";

const FALLBACK_SNAPSHOT: RadarSnapshot = {
  generated_at: "2026-08-09T10:36:37.032714Z",
  total_items: 134,
  items_ai: [
    {
      id: "fallback-1",
      title_zh: "用 DistilBERT LoRA 与 TF-IDF 做情感分析",
      published_at: "2026-08-09T07:17:35Z",
      ai_label: "model_release",
    },
    {
      id: "fallback-2",
      title_zh: "Seedance 2.5 上线六种创意玩法",
      published_at: "2026-08-09T05:25:02Z",
      ai_label: "ai_product_update",
    },
    {
      id: "fallback-3",
      title_zh: "AI 深度信号周报：安全、算力与模型竞争",
      published_at: "2026-08-09T03:30:30Z",
      ai_label: "infra_compute",
    },
    {
      id: "fallback-4",
      title_zh: "模型价格战加速 AI 应用普及",
      published_at: "2026-08-09T03:24:44Z",
      ai_label: "ai_product_update",
    },
  ],
};

function relativeTime(value?: string) {
  if (!value) return "刚刚";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "刚刚";
  const hours = Math.max(1, Math.round((Date.now() - timestamp) / 3_600_000));
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}

function radarCategory(item: RadarItem) {
  const value = `${item.ai_label ?? ""} ${item.aihot_category ?? ""}`;
  if (/model|research|paper/i.test(value)) return "模型";
  if (/tool|product|launch/i.test(value)) return "产品";
  return "开发者";
}

function radarTitle(item: RadarItem) {
  return item.title_zh || item.title || item.title_bilingual || "AI 前沿信号";
}

function formatToday() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  })
    .format(new Date())
    .replaceAll("/", "-");
}

export default function PortalHome() {
  const latestReport = getDefaultReport();
  const [active, setActive] = useState<"earnings" | "radar">("radar");
  const [snapshot, setSnapshot] = useState<RadarSnapshot>(FALLBACK_SNAPSHOT);
  const [today] = useState(formatToday);

  useEffect(() => {
    const controller = new AbortController();
    fetch(RADAR_DATA_URL, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: RadarSnapshot) => setSnapshot(data))
      .catch(() => setSnapshot(FALLBACK_SNAPSHOT));
    return () => controller.abort();
  }, []);

  const stories = useMemo(
    () => (snapshot?.items_ai ?? snapshot?.items ?? []).slice(0, 4),
    [snapshot],
  );

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div className="portal-header-inner">
          <Link className="portal-brand" href="/" aria-label="思航研究首页">
            <span>SR</span>
            <strong>思航研究</strong>
          </Link>
          <nav className="portal-switch" aria-label="选择研究板块">
            <button
              className={active === "earnings" ? "is-active" : ""}
              type="button"
              onClick={() => setActive("earnings")}
            >
              财报分析
            </button>
            <button
              className={active === "radar" ? "is-active" : ""}
              type="button"
              onClick={() => setActive("radar")}
            >
              <i aria-hidden="true" /> AI 热点
            </button>
          </nav>
          <time>{today}</time>
        </div>
      </header>

      <section className="portal-stage" aria-label="思航研究两大板块">
        <article className="portal-panel earnings-panel">
          <div className="portal-panel-heading">
            <span>最新研究</span>
            <h1>财报分析</h1>
            <p>结构化财务研究与价值洞察</p>
          </div>

          <div className="report-cover" aria-label="最新财报封面">
            <small>思航研究</small>
            <div>
              <strong>{latestReport.companyNameEn}</strong>
              <span>{latestReport.periodLabel} 业绩分析报告</span>
            </div>
            <FileText size={22} weight="thin" aria-hidden="true" />
          </div>

          <div className="latest-report-copy">
            <h2>
              {latestReport.companyName}（{latestReport.ticker}）
            </h2>
            <p>{latestReport.periodLabel} 业绩分析报告</p>
            <span>增长质量 · 利润结构 · 战略验证</span>
          </div>

          <Link className="portal-cta earnings-cta" href="/earnings/">
            <ChartLineUp size={20} weight="regular" />
            查看财报分析
            <ArrowRight size={18} />
          </Link>
        </article>

        <article className="portal-panel radar-panel">
          <div className="radar-visual" aria-hidden="true" />
          <div className="radar-content">
            <div className="radar-live-row">
              <span className="live-pill"><i /> LIVE</span>
              <span>AI 24h 信号</span>
            </div>
            <div className="radar-number-row">
              <strong>{snapshot.total_items}</strong>
              <Pulse size={84} weight="thin" aria-hidden="true" />
            </div>
            <h1>AI 正在重塑<br />我们的工作方式</h1>
            <p className="radar-subtitle">追踪前沿 · 发现机会 · 验证价值</p>
            <nav className="radar-filters" aria-label="AI 热点分类">
              {['全部', '模型', '产品', '开发者'].map((label) => (
                <span className={label === '全部' ? 'is-active' : ''} key={label}>{label}</span>
              ))}
            </nav>

            <ol className="radar-stories">
              {stories.map((item, index) => (
                <li key={item.id ?? `${radarTitle(item)}-${index}`}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <span>{radarCategory(item)}</span>
                  <div>
                    <strong>{radarTitle(item)}</strong>
                    <small>{relativeTime(item.published_at)}</small>
                  </div>
                </li>
              ))}
            </ol>

            <Link className="portal-cta radar-cta" href="/ai-radar/">
              <Broadcast size={21} weight="regular" />
              进入 AI 热点
              <ArrowRight size={18} />
            </Link>
          </div>
        </article>
      </section>

      <footer className="portal-footer">
        <span>思航研究 · 公司研究与 AI 情报</span>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
          京ICP备2026051102号-1
        </a>
      </footer>
    </main>
  );
}
