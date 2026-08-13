import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "https://www.shresearch.cn";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "思航研究｜财报分析与 AI 热点",
  description:
    "以结构化证据研究公司财报，并用 AI 情报雷达追踪过去 24 小时的重要技术信号。",
  keywords: [
    "美团",
    "美团财报",
    "03690.HK",
    "财报分析",
    "公司研究",
    "思航研究",
  ],
  authors: [{ name: "姚思航", url: "https://github.com/nevilaa" }],
  openGraph: {
    title: "思航研究｜财报分析与 AI 热点",
    description: "公司财报研究与实时 AI 情报，汇聚在同一个个人研究网站。",
    url: siteUrl,
    siteName: "思航研究",
    locale: "zh_CN",
    type: "article",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "思航研究财报分析与 AI 热点",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "思航研究｜财报分析与 AI 热点",
    description: "结构化公司研究与实时 AI 情报雷达。",
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
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
