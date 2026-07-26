export type Tone = "positive" | "negative" | "neutral";

export type KeyMetric = {
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

export type Segment = {
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

export type Expense = {
  name: string;
  value: number;
  unit: string;
  yoy: number;
  revenueShare: number;
  shareChangePp: number;
};

export type BusinessItem = {
  name: string;
  volume: string;
  price: string;
  effect: string;
};

export type Signal = {
  speaker: string;
  signal: string;
  interpretation: string;
};

export type Competitor = {
  name: string;
  action: string;
  impact: string;
  horizon: string;
};

export type Shock = {
  source: string;
  intensity: string;
  direction: string;
  financialTrace: string;
  nextQuarter: string;
};

export type WatchItem = {
  metric: string;
  target: string;
  why: string;
};

export type AnalysisLayer = {
  id: string;
  index: number;
  title: string;
  question: string;
  verdict: string;
  items?: BusinessItem[];
  expenses?: Expense[];
  dataStatus?: string;
  watchItems?: string[];
  watchlist?: WatchItem[];
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

export type Scenario = {
  id: string;
  name: string;
  probability: number;
  tone: Tone;
  triggers: string[];
  coreLocalProfitRange: [number, number];
  adjustedNetProfitRange: [number, number];
  unit: string;
};

export type EventItem = {
  event: string;
  impact: string;
};

export type ReportData = {
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
