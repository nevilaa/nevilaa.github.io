export type ReportStatus = "published" | "draft";

export type ReportCatalogEntry = {
  id: string;
  companyId: string;
  companyName: string;
  companyNameEn: string;
  ticker: string;
  iconUrl: string;
  fiscalYear: number;
  quarter: "Q1" | "Q2" | "Q3" | "Q4" | "FY";
  periodLabel: string;
  publishedAt: string;
  endpoint: string;
  status: ReportStatus;
};

const DEFAULT_ENDPOINT =
  "https://82.157.208.201/financial-data/meituan-2026-q1.json";

/**
 * Add future companies and quarters here. The interface derives both selectors
 * and the research-library navigation from this single registry.
 */
export const REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    id: "tencent-2026-q1",
    companyId: "tencent",
    companyName: "腾讯控股",
    companyNameEn: "Tencent Holdings",
    ticker: "0700.HK",
    iconUrl: "https://www.tencent.com/favicon.ico",
    fiscalYear: 2026,
    quarter: "Q1",
    periodLabel: "2026 Q1",
    publishedAt: "2026-07-30",
    endpoint: "/data/tencent-2026-q1.json",
    status: "published",
  },
  {
    id: "didi-2026-q1",
    companyId: "didi",
    companyName: "滴滴出行",
    companyNameEn: "DiDi Global",
    ticker: "DIDIY",
    iconUrl: "https://website.didiglobal.com/DDlogo.ico",
    fiscalYear: 2026,
    quarter: "Q1",
    periodLabel: "2026 Q1",
    publishedAt: "2026-07-30",
    endpoint: "/data/didi-2026-q1.json",
    status: "published",
  },
  {
    id: "kuaishou-2026-q1",
    companyId: "kuaishou",
    companyName: "快手科技",
    companyNameEn: "Kuaishou",
    ticker: "01024.HK",
    iconUrl: "https://www.kuaishou.com/favicon.ico",
    fiscalYear: 2026,
    quarter: "Q1",
    periodLabel: "2026 Q1",
    publishedAt: "2026-07-27",
    endpoint: "/data/kuaishou-2026-q1.json",
    status: "published",
  },
  {
    id: "meituan-2026-q1",
    companyId: "meituan",
    companyName: "美团",
    companyNameEn: "Meituan",
    ticker: "03690.HK",
    iconUrl: "https://www.meituan.com/favicon.ico",
    fiscalYear: 2026,
    quarter: "Q1",
    periodLabel: "2026 Q1",
    publishedAt: "2026-06-01",
    endpoint:
      process.env.NEXT_PUBLIC_FINANCIAL_DATA_URL ?? DEFAULT_ENDPOINT,
    status: "published",
  },
];

export const PUBLISHED_REPORTS = REPORT_CATALOG.filter(
  (report) => report.status === "published",
).sort(
  (a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
);

export const COMPANY_OPTIONS = Array.from(
  new Map(
    PUBLISHED_REPORTS.map((report) => [
      report.companyId,
      {
        id: report.companyId,
        name: report.companyName,
        nameEn: report.companyNameEn,
        ticker: report.ticker,
        iconUrl: report.iconUrl,
      },
    ]),
  ).values(),
);

export function reportsForCompany(companyId: string) {
  return PUBLISHED_REPORTS.filter((report) => report.companyId === companyId);
}

export function getDefaultReport() {
  return PUBLISHED_REPORTS[0];
}
