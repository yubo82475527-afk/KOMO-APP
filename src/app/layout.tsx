import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KOMO",
    template: "%s | KOMO",
  },
  description: "KOMO 员工工作台，覆盖审批、排班、打卡与个人资料等日常办公流程。",
  applicationName: "KOMO",
  keywords: ["KOMO", "OA", "审批", "排班", "打卡", "员工工作台"],
  openGraph: {
    title: "KOMO",
    description: "KOMO 员工工作台，覆盖审批、排班、打卡与个人资料等日常办公流程。",
    siteName: "KOMO",
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
