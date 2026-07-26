import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nevilaa.github.io"),
  title: "美团 2026 Q1 财报深度分析｜思航研究",
  description:
    "用业务、成本、现金流、管理层、竞争、外部冲击、股价归因和情景推演八层框架，拆解美团 2026 Q1 财报。",
  keywords: ["美团", "美团财报", "03690.HK", "财报分析", "公司研究", "思航研究"],
  authors: [{ name: "姚思航", url: "https://github.com/nevilaa" }],
  openGraph: {
    title: "美团 2026 Q1 财报深度分析",
    description: "短期盈利让位长期战略，最坏时点或已过去，但拐点仍需 Q2 验证。",
    url: "https://nevilaa.github.io",
    siteName: "思航研究",
    locale: "zh_CN",
    type: "article",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "美团 2026 Q1 财报深度分析",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "美团 2026 Q1 财报深度分析",
    description: "八层穿透框架：从财务数字到可证伪的 Q2 判断。",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
