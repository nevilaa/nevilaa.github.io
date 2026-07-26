# 思航研究 · 财报工作台

一个默认展示最新财报、按公司与财季持续扩展的个人研究工作台。当前收录美团 2026 Q1，报告使用九模块框架：

- 财务事实：业务拆解、成本效率、现金与资产
- 经营解释：管理层信号、竞争格局、外部变量
- 投资判断：市场定价、情景与验证、研究结论

结构化财报数据由独立服务器上的只读 JSON 接口提供，前端保留在 GitHub Pages。

## 新增公司或财季

1. 在数据服务器发布符合 `app/report-types.ts` 的 JSON。
2. 在 `app/report-catalog.ts` 增加一条报告记录。
3. 公司、财季选择器和研究库导航会自动更新，无需重做页面。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

项目使用 Next.js 静态导出，并通过 GitHub Actions 部署到 GitHub Pages。

设计与产品上下文分别记录在 `PRODUCT.md`、`DESIGN.md` 和 `.impeccable/design.json`。
