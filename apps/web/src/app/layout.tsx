import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARATC - Philippine Digital Learning Platform",
  description: "Your lifelong digital learning companion — from Grade 1 through professional examinations. Structured curriculum, comprehensive question banks, and personalized learning paths.",
  keywords: ["learning platform", "education", "Philippines", "K-12", "board exam", "entrance exam", "online learning"],
  authors: [{ name: "ARATC Inc." }],
  openGraph: {
    title: "ARATC - Philippine Digital Learning Platform",
    description: "Learn. Practice. Excel. Your lifelong digital learning companion.",
    type: "website",
    locale: "en_PH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
