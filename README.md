# 思航研究 · 美团 2026 Q1

一个聚焦美团 2026 年第一季度的深度财报研究网站。报告使用八层框架：

- 业务细节穿透
- 成本费用穿透
- 资产负债与现金流
- 管理层信号
- 竞争格局
- 外部冲击映射
- 股价走势归因
- 未来推演与投资信号

结构化财报数据由独立服务器上的只读 JSON 接口提供，前端保留在 GitHub Pages。

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
