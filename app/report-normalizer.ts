import type {
  AnalysisLayer,
  BusinessItem,
  EventItem,
  Expense,
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
  // Unit adaptation: legacy payloads store values in "分" (cent) and display as 亿元;
  // MiniMax (0100.HK) stores absolute USD amounts -> display as US$M.
  const isMiniMax = /0100\.HK/i.test(stringValue(rawReport.ticker)) || /MiniMax/i.test(companyName);
  const isUsdReport = /GOOGL|GOOG|META/i.test(stringValue(rawReport.ticker));
  const isFy2025BaseCurrency = /FY2025/i.test(stringValue(rawReport.period));
  const moneyScale = () =>
    isMiniMax ? 1_000_000 : isFy2025BaseCurrency ? 100_000_000 : 100;
  const moneyUnit = () => (isMiniMax ? "US$M" : isUsdReport ? "亿美元" : "亿元");
  // 金额类 metric 需要按币种缩放；百分数/计数类 metric 保持原值。
  const MONEY_METRICS = new Set([
    "total_revenue",
    "total_revenue_prior",
    "revenue_ai_native_products",
    "revenue_open_platform",
    "revenue_open_platform_enterprise",
    "revenue_geography_rest_of_world",
    "gross_profit",
    "cost_of_sales",
    "selling_and_distribution_expenses",
    "administrative_expenses",
    "research_and_development_expenses",
    "other_income_and_gains_net",
    "fair_value_loss_on_financial_liabilities",
    "net_loss_gaap",
    "adjusted_net_loss_non_ifrs",
    "cash_and_cash_equivalents",
    "total_cash_and_financial_assets",
    "net_current_liabilities",
    "net_cash_used_in_operating_activities",
    "operating_cash_flow",
    "capital_expenditures",
    "net_cash_from_investing",
    "net_cash_from_financing",
    "capex_ppe",
    "ipo_net_proceeds",
    "net_product_revenues",
    "net_service_revenues",
    "online_marketing_revenue",
    "transaction_services_revenue",
    "ai_powered_revenue",
    "cloud_revenue",
    "marketing_expenses",
    "sales_and_marketing_expenses",
    "fulfillment_expenses",
    "general_and_administrative_expenses",
    "cost_of_revenue",
    "cost_of_revenues",
    "research_and_development_expenses",
    "segment_revenue",
    "segment_income_from_operations",
    "operating_income",
    "net_income",
    "free_cash_flow",
    "cash_and_marketable_securities",
    "profit_attributable_to_equity_holders",
    "adjusted_ebita",
    "adjusted_ebitda",
    "adjusted_profit_non_ifrs",
    "core_platform_gvt",
    "gtv_china_mobility",
    "gtv_international",
    "platform_sales_china_mobility",
    "platform_sales_international",
    "total_cash_and_treasury_investments",
    "operations_and_support_expenses",
    // NetEase (9999.HK / NTES) 专属
    "netease_net_income_attributable",
    "netease_non_gaap_net_income",
    "netease_free_cash_flow",
    "net_cash",
  ]);
  const scaleValue = (metric: string, value: number | undefined) => {
    if (!value) return 0;
    return MONEY_METRICS.has(metric) ? value / moneyScale() : value;
  };
  const factValue = (metric: string) =>
    Math.round(scaleValue(metric, numberValue(fact(metric)?.value)) * 10) / 10;
  const factDisplay = (metric: string) => stringValue(fact(metric)?.display_value);
  const previousValue = (metric: string) => {
    const own = numberValue(fact(metric)?.previous_value);
    if (own) return own;
    const PREV_ALIASES: Record<string, string> = {
      total_revenue: "total_revenue_prev",
      online_marketing_revenue: "online_marketing_prev",
      net_income_attributable: "net_income_prev",
      non_gaap_net_income: "non_gaap_net_income_prev",
      ai_powered_revenue: "ai_powered_revenue_prev",
    };
    const alias = PREV_ALIASES[metric] ?? `${metric}_prev`;
    const aliasValue = numberValue(fact(alias)?.value);
    if (aliasValue) return aliasValue;
    // MiniMax payload uses `_prior` suffix for prior-year values.
    return numberValue(fact(`${metric}_prior`)?.value);
  };
  const yoyOf = (metric: string) => {
    // Prefer an explicit yoy fact when present (e.g. revenue_yoy for MiniMax).
    const explicitYoy = numberValue(fact(`${metric}_yoy`)?.value);
    if (explicitYoy) return Math.round(explicitYoy * 10) / 10;
    const current = numberValue(fact(metric)?.value);
    const previous = previousValue(metric);
    if (!current || !previous) return undefined;
    return Math.round((current / previous - 1) * 1000) / 10;
  };
  const yoyTextOf = (metric: string) => {
    const yoy = yoyOf(metric);
    return typeof yoy === "number" ? `${yoy >= 0 ? "+" : ""}${yoy}% YoY` : undefined;
  };
  const yoyOfFact = (item: UnknownRecord) => {
    const explicitYoy = numberValue(item.yoy);
    if (explicitYoy) return Math.round(explicitYoy * 10) / 10;
    // MiniMax 分部：优先取 `_yoy` 事实（如 revenue_ai_native_products_yoy）。
    const metricYoy = numberValue(fact(`${stringValue(item.metric)}_yoy`)?.value);
    if (metricYoy) return Math.round(metricYoy * 10) / 10;
    const current = numberValue(item.value);
    const previous = numberValue(item.previous_value);
    if (!current || !previous) return 0;
    return Math.round((current / previous - 1) * 1000) / 10;
  };
  const splitFactors = (value: unknown) =>
    stringValue(value)
      .split(/[；;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  const thesis = stringValue(
    summary.thesis ?? rawReport.thesis,
    "请以结构化数据中的研究结论为准。",
  );
  const segmentRevenueFacts = facts.filter(
    (item) =>
      (item.metric === "segment_revenue" ||
        (isMiniMax &&
          (item.metric === "revenue_ai_native_products" ||
            item.metric === "revenue_open_platform" ||
            item.metric === "revenue_open_platform_enterprise"))) &&
      stringValue(item.segment || item.metric),
  );
  const segmentOpBySegment = new Map(
    facts
      .filter(
        (item) =>
          item.metric === "segment_income_from_operations" &&
          stringValue(item.segment),
      )
      .map((item) => [stringValue(item.segment), item]),
  );
  // MiniMax 分部事实的 segment 字段为英文名，表格/口径变更区需展示中文名；
  // 其他 8 家公司的 metric 不在此映射中，渲染不受影响。
  const SEGMENT_NAME_OVERRIDES: Record<string, string> = {
    revenue_ai_native_products: "AI 原生产品",
    revenue_open_platform: "开放平台及企业服务",
    revenue_open_platform_enterprise: "开放平台及企业服务",
  };
  const segmentNameOf = (item: UnknownRecord) =>
    SEGMENT_NAME_OVERRIDES[stringValue(item.metric)] ||
    stringValue(item.segment) ||
    stringValue(item.metric);
  const KEY_METRIC_CATALOG: Record<
    string,
    { label: string; tone: "positive" | "negative" | "neutral"; result: string }
  > = {
    total_revenue: { label: "总收入", tone: "neutral", result: "规模稳定" },
    net_income_attributable_to_ordinary_shareholders: {
      label: "归母净利润",
      tone: "negative",
      result: "同比下滑",
    },
    net_income_attributable: { label: "归母净利润", tone: "negative", result: "同比下滑" },
    nongaap_net_income_attributable_to_ordinary_shareholders: {
      label: "Non-GAAP 归母净利",
      tone: "negative",
      result: "同比下滑",
    },
    nongaap_net_income: { label: "Non-GAAP 归母净利", tone: "negative", result: "同比下滑" },
    free_cash_flow: { label: "自由现金流", tone: "negative", result: "资本开支挤压" },
    operating_cash_flow: { label: "经营现金流", tone: "neutral", result: "现金转化" },
    capital_expenditures: { label: "资本开支", tone: "neutral", result: "投入强度" },
    electronics_and_home_appliances_revenues: {
      label: "带电品类收入",
      tone: "negative",
      result: "同比下滑",
    },
    eha_revenues: { label: "带电品类收入", tone: "negative", result: "同比下滑" },
    general_merchandise_revenues: { label: "日百品类收入", tone: "positive", result: "高增长" },
    gm_revenues: { label: "日百品类收入", tone: "positive", result: "高增长" },
    marketplace_and_marketing_revenues: {
      label: "平台及广告收入",
      tone: "positive",
      result: "高增长",
    },
    marketplace_marketing_revenues: {
      label: "平台及广告收入",
      tone: "positive",
      result: "高增长",
    },
    net_service_revenues: { label: "服务收入", tone: "positive", result: "高增长" },
    service_revenue: { label: "服务收入", tone: "positive", result: "高增长" },
    ai_powered_revenue: { label: "AI 相关收入", tone: "positive", result: "增长引擎" },
    online_marketing_revenue: {
      label: "在线营销收入",
      tone: "negative",
      result: "持续承压",
    },
    transaction_services_revenue: {
      label: "交易服务收入",
      tone: "positive",
      result: "结构拐点",
    },
    gross_profit: { label: "毛利润", tone: "neutral", result: "规模稳定" },
    operating_income: { label: "营业利润", tone: "positive", result: "持续扩张" },
    net_income: { label: "净利润", tone: "neutral", result: "含非经营收益" },
    // MiniMax (0100.HK) 专属：美元口径，财务快照多行
    gross_margin: { label: "毛利率", tone: "positive", result: "效率改善" },
    adjusted_net_loss_non_ifrs: {
      label: "经调整净亏损",
      tone: "negative",
      result: "亏损收窄",
    },
    net_cash_used_in_operating_activities: {
      label: "经营活动现金净流出",
      tone: "negative",
      result: "现金消耗",
    },
    total_cash_and_financial_assets: {
      label: "现金及金融资产",
      tone: "positive",
      result: "资金充裕",
    },
    // DiDi (DIDIY) 专属
    profit_attributable_to_equity_holders: {
      label: "归母净利润",
      tone: "positive",
      result: "扭亏为盈",
    },
    adjusted_ebita: { label: "调整后 EBITA", tone: "neutral", result: "经营口径观察" },
    core_platform_gvt: { label: "核心平台 GTV", tone: "positive", result: "双位数增长" },
    // NetEase (9999.HK / NTES) 专属
    netease_net_income_attributable: {
      label: "归母净利润",
      tone: "positive",
      result: "同比稳增",
    },
    netease_non_gaap_net_income: {
      label: "Non-GAAP 归母净利",
      tone: "positive",
      result: "同比稳增",
    },
    netease_free_cash_flow: {
      label: "自由现金流",
      tone: "positive",
      result: "现金覆盖充足",
    },
    net_cash: { label: "净现金", tone: "positive", result: "资金充裕" },
  };
  const BRAND_COLORS: Array<[RegExp, string]> = [
    [/9961|Trip\.com|携程/i, "#1471db"],
    [/9618|JD/i, "#e1251b"],
    [/PDD/i, "#e02e24"],
    [/BIDU/i, "#2932e1"],
    [/0700/i, "#00a2e8"],
    [/9988/i, "#ff6a00"],
    [/01024/i, "#ff7100"],
    [/DIDI/i, "#fc6b00"],
    [/9999|NTES|网易/i, "#e60012"],
  ];
  const brandColorFor = (ticker: string, name: string) =>
    BRAND_COLORS.find(([pattern]) => pattern.test(ticker) || pattern.test(name))?.[1] ??
    "#1f2937";
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
    // 百分数类 metric（如毛利率）用 %；金额类 metric 用币种单位。
    unit: fact(id)?.unit === "percent" ? "%" : moneyUnit(),
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
    unit: moneyUnit(),
  }));
  const moduleClaims = (id: string) => list(moduleById(id)?.claims);
  const managementClaims = moduleClaims("management");
  const competitionClaims = moduleClaims("competition");
  const externalClaims = moduleClaims("external_shocks");
  const businessClaims = moduleClaims("business");
  const balanceClaims = moduleClaims("cash_flow");
  const researchClaims = moduleClaims("research_signal");
  const totalRevenueValue = numberValue(fact("total_revenue")?.value);
  const previousTotalRevenueValue = previousValue("total_revenue");
  const expenseCatalog: Array<{ metric: string; name: string }> = [
    { metric: "cost_of_revenue", name: "营业成本" },
    { metric: "fulfillment_expenses", name: "履约费用" },
    { metric: "marketing_expenses", name: "营销费用" },
    { metric: "sales_and_marketing_expenses", name: "营销费用" },
    { metric: "research_and_development_expenses", name: "研发费用" },
    { metric: "general_and_administrative_expenses", name: "管理费用" },
    { metric: "cost_of_revenues", name: "营业成本" },
    { metric: "operations_and_support_expenses", name: "运营支持费用" },
    { metric: "fulfillment", name: "履约费用" },
    { metric: "marketing", name: "营销费用" },
    { metric: "rnd", name: "研发费用" },
    { metric: "ga", name: "管理费用" },
  ];
  const expenses: Expense[] = expenseCatalog
    .filter((item) => fact(item.metric))
    .map((item) => {
      const value = numberValue(fact(item.metric)?.value);
      const previous = previousValue(item.metric);
      const shareRaw = totalRevenueValue ? (value / totalRevenueValue) * 100 : 0;
      const previousShareRaw =
        previousTotalRevenueValue && previous
          ? (previous / previousTotalRevenueValue) * 100
          : 0;
      return {
        name: item.name,
        value: Math.round((value / moneyScale()) * 10) / 10,
        unit: moneyUnit(),
        yoy: yoyOf(item.metric) ?? 0,
        revenueShare: Math.round(shareRaw * 10) / 10,
        shareChangePp:
          previousTotalRevenueValue && previous
            ? Math.round((shareRaw - previousShareRaw) * 10) / 10
            : 0,
      };
    });
  const BUSINESS_ITEM_CATALOG: Array<{ metric: string; name: string; effect: string }> = [
    { metric: "ai_powered_revenue", name: "AI 相关收入", effect: "增长引擎" },
    { metric: "online_marketing_revenue", name: "在线营销收入", effect: "持续承压" },
    {
      metric: "electronics_and_home_appliances_revenues",
      name: "带电品类（3C+家电）",
      effect: "高基数与涨价承压",
    },
    { metric: "eha_revenues", name: "带电品类（3C+家电）", effect: "高基数与涨价承压" },
    { metric: "general_merchandise_revenues", name: "日用百货", effect: "增长主轴" },
    { metric: "gm_revenues", name: "日用百货", effect: "增长主轴" },
    { metric: "net_service_revenues", name: "服务收入", effect: "高毛利引擎" },
    { metric: "service_revenue", name: "服务收入", effect: "高毛利引擎" },
    { metric: "transaction_services_revenue", name: "交易服务收入", effect: "结构拐点" },
  ];
  const businessItems: BusinessItem[] = BUSINESS_ITEM_CATALOG.filter((item) =>
    fact(item.metric),
  ).map((item) => ({
    name: item.name,
    volume: factDisplay(item.metric),
    price: yoyTextOf(item.metric) ?? "未披露",
    effect: item.effect,
  }));
  const marketIntraday = numberValue(rawReport.market_intraday_max_pct);
  const marketClose = numberValue(rawReport.market_close_pct);
  // MiniMax 无财报日涨跌幅数字，但 market_reaction 模块有事件化 claim；
  // 券商目标价等「仅供内部参考」内容不得进入公开站点。
  const marketReactionClaims = moduleClaims("market_reaction").filter(
    (claim) => !/仅供内部参考|内部参考|券商目标价|目标价/.test(claimText(claim)),
  );
  const reaction =
    marketIntraday !== 0 || marketClose !== 0
      ? {
          intradayMaxPct: marketIntraday,
          closePct: marketClose,
          bullFactors: splitFactors(summary.catalyst).slice(0, 3),
          bearFactors: splitFactors(summary.risk).slice(0, 3),
        }
      : marketReactionClaims.length
        ? {
            intradayMaxPct: 0,
            closePct: 0,
            bullFactors: marketReactionClaims
              .filter((claim) => /首日|上涨|IPO|市值|募资|走强|大涨/.test(claimText(claim)))
              .slice(0, 3)
              .map(claimText),
            bearFactors: marketReactionClaims
              .filter((claim) =>
                /下跌|稀释|可转债|承压|悬顶|回落|回调/.test(claimText(claim)),
              )
              .slice(0, 3)
              .map(claimText),
          }
        : undefined;
  const analysisLayers: AnalysisLayer[] = [
    layer("business", 1, "业务拆解", { items: businessItems }),
    layer("costs", 2, "成本效率", {
      dataStatus: expenses.length ? "已覆盖关键成本事实" : "待补充",
      watchItems: ["新业务投入斜率", "履约与研发投入的回报"],
      ...(expenses.length ? { expenses } : {}),
    }),
    layer("cash_flow", 3, "现金与资产", {
      dataStatus: balanceClaims.length ? "已覆盖现金流事实" : "待补充",
      watchItems: ["自由现金流走向", "资本开支与股东回报的平衡"],
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
      ...(reaction ? { reaction } : {}),
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
    layer("research_signal", 9, "研究结论", {
      verdict: researchClaims[0]
        ? claimText(researchClaims[0]).slice(0, 160)
        : "研究结论见结语与写在最后。",
    }),
  ];
  const event = (value: unknown, fallback: string): EventItem => ({
    event: stringValue(value, fallback),
    impact: "需结合下一季度披露验证。",
  });

  return {
    schemaVersion: stringValue(payload.schema_version, "site-1.0.0"),
    slug: stringValue(payload.id, "report"),
    updatedAt: generatedAt,
    company: {
      name: companyName,
      nameEn: stringValue(rawReport.company_name_en, companyName),
      ticker: stringValue(rawReport.ticker, "—"),
      adrTicker: stringValue(rawReport.ticker, "—"),
      brandColor: brandColorFor(stringValue(rawReport.ticker), companyName),
    },
    report: {
      title: isMiniMax
        ? "全球消费 AI 平台的增长与烧钱张力：MiniMax（0100.HK）FY2025 财报深读"
        : `${companyName} ${period} 财报深度分析`,
      period,
      periodEnd: stringValue(rawReport.period_end, "未披露"),
      publishedAt: generatedAt.slice(0, 10),
      analyzedAt: generatedAt.slice(0, 10),
      analysts: ["思航研究"],
      framework: "九模块证据链 + 苏格拉底式反证",
      disclaimer: stringValue(rawReport.disclaimer, "仅供研究学习，不构成投资建议。"),
    },
    thesis: {
      rating: stringValue(summary.rating, "中性"),
      stars: summary.confidence === "high" ? 4 : summary.confidence === "low" ? 2 : 3,
      headline: thesis,
      coreConflict: stringValue(summary.core_conflict, thesis),
      falsifiableSignal: stringValue(summary.falsifier, "下一季度数据改善将推翻当前判断。"),
      priceAtAnalysis: numberValue(rawReport.share_price),
      priceCurrency: stringValue(rawReport.share_price_currency),
      valuationContext: stringValue(summary.valuation_context, "估值判断见研究结论。"),
      strategicSummary: {
        primaryDifficulty: stringValue(summary.primary_difficulty, thesis),
        strategicJudgment: stringValue(summary.strategic_judgment, thesis),
        currentChallenges,
        futureDirections,
      },
    },
    keyMetrics: Object.entries(KEY_METRIC_CATALOG)
      .filter(([metricKey]) => fact(metricKey))
      .map(([metricKey, config]) => {
        // 动态判定收入类指标的结论/情绪：有 yoy 数据时按增减方向生成，
        // 避免 MiniMax 等高增长公司被误标为「规模稳定」。
        const dynamicResult = (() => {
          if (metricKey === "total_revenue" && typeof yoyOf("total_revenue") === "number") {
            const yoy = yoyOf("total_revenue")!;
            return yoy > 0 ? "同比高增长" : yoy < 0 ? "同比下滑" : "规模稳定";
          }
          if (
            isMiniMax &&
            metricKey === "gross_profit" &&
            typeof yoyOf("gross_profit") === "number"
          ) {
            const yoy = yoyOf("gross_profit")!;
            return yoy > 0 ? "高速扩张" : yoy < 0 ? "同比下滑" : "规模稳定";
          }
          if (
            isMiniMax &&
            metricKey === "adjusted_net_loss_non_ifrs" &&
            typeof yoyOf("adjusted_net_loss_non_ifrs") === "number"
          ) {
            const yoy = yoyOf("adjusted_net_loss_non_ifrs")!;
            return yoy > 0 ? "亏损扩大" : yoy < 0 ? "亏损收窄" : "亏损持平";
          }
          return config.result;
        })();
        const dynamicTone =
          metricKey === "total_revenue" && typeof yoyOf("total_revenue") === "number"
            ? yoyOf("total_revenue")! > 0
              ? "positive"
              : yoyOf("total_revenue")! < 0
                ? "negative"
                : "neutral"
            : isMiniMax &&
                metricKey === "gross_profit" &&
                typeof yoyOf("gross_profit") === "number"
              ? yoyOf("gross_profit")! > 0
                ? "positive"
                : "neutral"
              : config.tone;
        return metric(
          metricKey,
          config.label,
          factValue(metricKey),
          dynamicResult,
          dynamicTone,
          yoyTextOf(metricKey),
        );
      }),
    segments: segmentRevenueFacts.map((item, index) => {
      const rawName = stringValue(item.segment) || stringValue(item.metric);
      const opFact = segmentOpBySegment.get(rawName);
      const name = segmentNameOf(item);
      const revenue = numberValue(item.value) / moneyScale();
      const operatingProfit = opFact ? numberValue(opFact.value) / moneyScale() : 0;
      const previousRevenue = numberValue(item.previous_value);
      const previousOp = opFact ? numberValue(opFact.previous_value) : 0;
      return {
        id: `segment-${index + 1}`,
        name,
        revenue: Math.round(revenue * 10) / 10,
        revenueUnit: moneyUnit(),
        revenueYoy: yoyOfFact(item) || Math.round(numberValue(item.yoy || 0) * 10) / 10,
        operatingProfit: Math.round(operatingProfit * 10) / 10,
        operatingProfitUnit: moneyUnit(),
        priorYearOperatingProfit: Math.round((previousOp / moneyScale()) * 10) / 10,
        priorQuarterOperatingProfit: 0,
        margin: revenue ? Math.round((operatingProfit / revenue) * 1000) / 10 : 0,
        priorYearMargin: previousRevenue
          ? Math.round((previousOp / previousRevenue) * 1000) / 10
          : 0,
        summary: opFact
          ? stringValue(opFact.display_value)
          : "分部利润未单独披露",
      };
    }),
    revenuePresentation: {
      changed: Boolean(rawReport.revenue_presentation_changed),
      description: businessClaims[0]
        ? claimText(businessClaims[0]).slice(0, 140)
        : "收入结构数据见财务快照与分部经济性。",
      items: [
        ...(fact("net_product_revenues")
          ? [
              {
                name: "产品收入",
                detail: "自营商品销售",
                value: factValue("net_product_revenues"),
                unit: moneyUnit(),
                yoy: yoyOf("net_product_revenues") ?? 0,
              },
            ]
          : []),
        ...(fact("net_service_revenues")
          ? [
              {
                name: "服务收入",
                detail: "平台、广告、物流等服务",
                value: factValue("net_service_revenues"),
                unit: moneyUnit(),
                yoy: yoyOf("net_service_revenues") ?? 0,
              },
            ]
          : []),
        ...(fact("online_marketing_revenue")
          ? [
              {
                name: "在线营销收入",
                detail: "商家广告费（高毛利收费口）",
                value: factValue("online_marketing_revenue"),
                unit: moneyUnit(),
                yoy: yoyOf("online_marketing_revenue") ?? 0,
              },
            ]
          : []),
        ...(fact("transaction_services_revenue")
          ? [
              {
                name: "交易服务收入",
                detail: "交易抽佣、多多买菜与平台服务费",
                value: factValue("transaction_services_revenue"),
                unit: moneyUnit(),
                yoy: yoyOf("transaction_services_revenue") ?? 0,
              },
            ]
          : []),
        ...segmentRevenueFacts.map((item) => ({
          name: segmentNameOf(item),
          detail: item.metric === "segment_revenue" ? "分部收入" : "分部收入",
          value: Math.round((numberValue(item.value) / moneyScale()) * 10) / 10,
          unit: moneyUnit(),
          yoy: yoyOfFact(item) || Math.round(numberValue(item.yoy || 0) * 10) / 10,
        })),
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
