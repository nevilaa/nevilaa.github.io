import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nevilaa.github.io"),
  title: "思航研究 — 财报分析排行榜",
  description:
    "用同一套框架比较公司的增长、盈利与现金流，把冗长财报压缩成清晰的经营信号。",
  keywords: ["财报分析", "公司研究", "基本面分析", "现金流", "思航研究"],
  authors: [{ name: "Sihang", url: "https://github.com/nevilaa" }],
  openGraph: {
    title: "思航研究 — 财报分析排行榜",
    description: "比较增长、盈利与现金流，看懂公司经营质量。",
    url: "https://nevilaa.github.io",
    siteName: "思航研究",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "思航研究财报分析排行榜",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "思航研究 — 财报分析排行榜",
    description: "比较增长、盈利与现金流，看懂公司经营质量。",
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
