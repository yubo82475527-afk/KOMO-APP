import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n-server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
