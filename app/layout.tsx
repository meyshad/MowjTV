import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "موج — تلویزیون زنده",
  description: "تلویزیون زنده، سبک و سازگار با ریموت تلویزیون سامسونگ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
