import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "https://nevilaa.github.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "思航研究｜财报工作台",
  description:
    "以九模块证据链持续跟踪公司财报、经营变化、情景概率与可证伪信号。",
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
    title: "思航研究｜财报工作台",
    description: "默认打开最新财报，以九模块证据链跟踪公司与季度。",
    url: siteUrl,
    siteName: "思航研究",
    locale: "zh_CN",
    type: "article",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "思航研究财报工作台",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "思航研究｜财报工作台",
    description: "九模块研究框架：从财务事实到可证伪判断。",
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
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
