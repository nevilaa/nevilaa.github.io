import type {
  AnalysisLayer,
  EventItem,
  ReportData,
  Scenario,
  StrategicChallenge,
  StrategicDirection,
} from "./report-types";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function list(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function numberList(value: unknown): number[] {
  return Array.isArray(value) ? value.map((item) => numberValue(item)) : [];
}

function claimText(claim: UnknownRecord) {
  return stringValue(claim.text, "暂无可用分析");
}

function newSchemaReport(payload: UnknownRecord): ReportData {
  const rawReport = record(payload.report);
  const summary = record(payload.conclusion_summary ?? rawReport.conclusion_summary);
  const companyName = stringValue(rawReport.company, "百度集团");
  const period = stringValue(rawReport.period, "2026Q1").replace("Q", " Q");
  const generatedAt = stringValue(payload.generated_at, new Date().toISOString());
  const facts = list(payload.facts);
  const modules = list(payload.modules);
  const scenarios = list(payload.scenarios);
  const sources = list(payload.sources);
  const fact = (metric: string) => facts.find((item) => item.metric === metric);
  const factValue = (metric: string) => numberValue(fact(metric)?.value) / 100;
  const thesis = stringValue(
    summary.thesis ?? rawReport.thesis,
    "百度正在切换收入引擎，AI 业务增长与盈利质量仍需验证。",
  );
  const currentChallenges: StrategicChallenge[] = list(summary.current_difficulties).map(
    (item) => ({
      title: stringValue(item.title, "待观察问题"),
      evidence: stringValue(item.evidence, "暂无证据"),
      implication: stringValue(item.implication, "暂无影响判断"),
    }),
  );
  const futureDirections: StrategicDirection[] = list(summary.strategic_directions).map(
    (item) => ({
      title: stringValue(item.direction, "待观察方向"),
      rationale: stringValue(item.rationale, "暂无战略解释"),
      managementSignal: stringValue(item.management_signal, "暂无管理层信号"),
      validation: stringValue(item.validation, "暂无验证指标"),
    }),
  );
  const moduleById = (id: string) => modules.find((item) => item.id === id);
  const layer = (
    id: string,
    index: number,
    title: string,
    overrides: Partial<AnalysisLayer> = {},
  ): AnalysisLayer => {
    const sourceModule = moduleById(id);
    const claims = list(sourceModule?.claims);
    return {
      id: id === "costs" ? "cost" : id === "cash_flow" ? "balance" : id === "external_shocks" ? "external" : id === "market_reaction" ? "market" : id === "future_scenarios" ? "future" : id,
      index,
      title,
      question: "以原始披露和可验证指标持续跟踪。",
      verdict: claimText(claims[0] ?? {}),
      ...overrides,
    };
  };
  const metric = (
    id: string,
    label: string,
    value: number,
    result: string,
    tone: "positive" | "negative" | "neutral",
    yoyText?: string,
  ) => ({
    id,
    label,
    value,
    unit: "亿元",
    yoyText,
    result,
    tone,
  });
  const scenarioName: Record<string, string> = {
    optimistic: "乐观",
    base: "中性",
    pessimistic: "悲观",
  };
  const scenarioTone: Record<string, Scenario["tone"]> = {
    optimistic: "positive",
    base: "neutral",
    pessimistic: "negative",
  };
  const normalizedScenarios: Scenario[] = scenarios.map((item, index) => ({
    id: stringValue(item.name, `scenario-${index + 1}`),
    name: scenarioName[stringValue(item.name)] ?? stringValue(item.name, "情景"),
    probability: numberValue(item.probability),
    tone: scenarioTone[stringValue(item.name)] ?? "neutral",
    triggers: Array.isArray(item.triggers)
      ? item.triggers.filter((value): value is string => typeof value === "string")
      : [],
    coreLocalProfitRange: [
      numberList(item.segment_profit_range)[0] ?? 0,
      numberList(item.segment_profit_range)[1] ?? 0,
    ],
    adjustedNetProfitRange: [
      numberList(item.group_profit_range)[0] ?? 0,
      numberList(item.group_profit_range)[1] ?? 0,
    ],
    unit: "亿元",
  }));
  const moduleClaims = (id: string) => list(moduleById(id)?.claims);
  const managementClaims = moduleClaims("management");
  const competitionClaims = moduleClaims("competition");
  const externalClaims = moduleClaims("external_shocks");
  const analysisLayers: AnalysisLayer[] = [
    layer("business", 1, "业务拆解", {
      items: [
        { name: "AI 云基础设施", volume: "88 亿元", price: "+79% YoY", effect: "AI 收入核心来源" },
        { name: "AI 应用", volume: "25 亿元", price: "大致持平", effect: "环比下滑" },
        { name: "在线营销", volume: "126 亿元", price: "-22% YoY", effect: "传统利润承压" },
      ],
    }),
    layer("costs", 2, "成本效率", {
      dataStatus: "已覆盖关键成本事实",
      watchItems: ["AI 云成本与资本开支强度", "研发和销售费用压缩是否可持续"],
    }),
    layer("cash_flow", 3, "现金与资产", {
      dataStatus: "已覆盖现金流事实",
      watchItems: ["自由现金流能否转正", "资本开支与 AI 云收入的匹配度"],
    }),
    layer("management", 4, "管理层信号", {
      signals: managementClaims.slice(0, 4).map((claim) => ({
        speaker: "管理层",
        signal: claimText(claim).slice(0, 80),
        interpretation: claimText(claim),
      })),
    }),
    layer("competition", 5, "竞争格局", {
      competitors: competitionClaims.slice(0, 4).map((claim, index) => ({
        name: `竞争变量 ${index + 1}`,
        action: claimText(claim).slice(0, 80),
        impact: claimText(claim),
        horizon: "未来 2-4 个季度",
      })),
    }),
    layer("external_shocks", 6, "外部变量", {
      shocks: externalClaims.slice(0, 4).map((claim, index) => ({
        source: `外部变量 ${index + 1}`,
        intensity: "中等",
        direction: "需跟踪",
        financialTrace: claimText(claim),
        nextQuarter: "观察下一季是否继续传导至收入、利润或现金流。",
      })),
    }),
    layer("market_reaction", 7, "市场定价", {
      reaction: {
        intradayMaxPct: 2.1,
        closePct: 2.1,
        bullFactors: ["AI 云收入保持较快增长", "昆仑芯分拆提供估值期权"],
        bearFactors: ["广告收入持续下滑", "自由现金流转负"],
      },
    }),
    layer("future_scenarios", 8, "情景与验证", {
      watchlist: normalizedScenarios.flatMap((item) =>
        item.triggers.slice(0, 2).map((trigger, index) => ({
          metric: `${item.name}情景验证 ${index + 1}`,
          target: trigger,
          why: "用于验证该情景是否正在发生。",
        })),
      ),
    }),
  ];
  const event = (value: unknown, fallback: string): EventItem => ({
    event: stringValue(value, fallback),
    impact: "需结合下一季度披露验证。",
  });

  return {
    schemaVersion: stringValue(payload.schema_version, "site-1.0.0"),
    slug: stringValue(payload.id, "baidu-2026q1"),
    updatedAt: generatedAt,
    company: {
      name: companyName,
      nameEn: "Baidu",
      ticker: stringValue(rawReport.ticker, "BIDU"),
      adrTicker: "BIDU",
      brandColor: "#2932e1",
    },
    report: {
      title: `${companyName} ${period}：AI 增长与盈利质量仍需验证`,
      period,
      periodEnd: "2026-03-31",
      publishedAt: generatedAt.slice(0, 10),
      analyzedAt: generatedAt.slice(0, 10),
      analysts: ["思航研究"],
      framework: "九模块证据链 + 苏格拉底式反证",
      disclaimer: stringValue(rawReport.disclaimer, "仅供研究学习，不构成投资建议。"),
    },
    thesis: {
      rating: stringValue(summary.rating, "中性偏谨慎"),
      stars: summary.confidence === "high" ? 4 : summary.confidence === "low" ? 2 : 3,
      headline: thesis,
      coreConflict: stringValue(summary.core_conflict, thesis),
      falsifiableSignal: stringValue(summary.falsifier, "下一季度数据改善将推翻当前判断。"),
      priceAtAnalysis: 107.48,
      priceCurrency: "USD",
      valuationContext: stringValue(summary.valuation_context, "估值仍取决于 AI 业务兑现。"),
      strategicSummary: {
        primaryDifficulty: stringValue(summary.primary_difficulty, thesis),
        strategicJudgment: stringValue(summary.strategic_judgment, thesis),
        currentChallenges,
        futureDirections,
      },
    },
    keyMetrics: [
      metric("revenue", "总收入", factValue("total_revenue"), "规模稳定", "neutral"),
      metric("ai", "AI 相关收入", factValue("ai_powered_revenue"), "增长引擎", "positive", "+49% YoY"),
      metric("marketing", "在线营销收入", factValue("online_marketing_revenue"), "持续承压", "negative", "-22% YoY"),
      metric("net-income", "归母净利润", factValue("net_income_attributable"), "同比下滑", "negative", "-55% YoY"),
      metric("free-cash-flow", "自由现金流", factValue("free_cash_flow"), "转负", "negative"),
    ],
    segments: [],
    revenuePresentation: {
      changed: true,
      description: "AI 业务已成为百度核心业务的主要收入增长来源。",
      items: [
        { name: "AI 云基础设施", detail: "收入 88 亿元，同比增长 79%。", value: factValue("ai_cloud_infra_revenue"), unit: "亿元", yoy: 79 },
        { name: "在线营销", detail: "收入 126 亿元，同比下降 22%。", value: factValue("online_marketing_revenue"), unit: "亿元", yoy: -22 },
      ],
    },
    analysisLayers,
    scenarios: normalizedScenarios,
    catalysts: [event(summary.catalyst, "AI 业务兑现")],
    risks: [event(summary.risk, "AI 投入回报不及预期")],
    methodology: {
      name: "九模块证据链 + 苏格拉底式反证",
      principles: ["先核对事实，再形成判断。", "区分公司披露、外部事实与研究推断。", "为每个结论保留可证伪信号。"],
      workflow: [
        { step: 1, name: "财务事实", description: "核对收入、利润、现金流和业务结构。" },
        { step: 2, name: "经营解释", description: "拆解管理层信号、竞争和外部变量。" },
        { step: 3, name: "投资判断", description: "建立情景概率并写出验证条件。" },
      ],
    },
    sources: sources.map((source) => ({
      type: stringValue(source.authority_level) === "tier1" ? "company" : "media",
      title: stringValue(source.title, "来源"),
      url: stringValue(source.url),
    })),
  };
}

export function normalizeReportPayload(payload: unknown): ReportData {
  const data = record(payload);
  if (data.thesis && data.company && data.report) return data as unknown as ReportData;
  if (data.conclusion_summary || data.report) return newSchemaReport(data);
  throw new Error("数据服务返回了无法识别的报告格式");
}
