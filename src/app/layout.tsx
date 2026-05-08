import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OA System",
  description: "A Vercel and Supabase powered OA system",
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
