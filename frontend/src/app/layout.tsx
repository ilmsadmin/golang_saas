import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZPlus SaaS Platform",
  description: "Nền tảng SaaS Multi-Tenant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
