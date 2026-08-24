import type { Metadata } from "next";
import { Poppins, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { deriveBrandTokens, type BrandSettings } from "@aratc/shared";

// Poppins - for headings, titles, buttons, and emphasis text
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Nunito - for body text
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Applies the organization's saved brand colors as CSS variable
 * overrides. Rendered server-side so themed pages paint correctly
 * on first frame (no flash). `no-store` keeps saves in
 * /admin/settings visible immediately after router.refresh().
 * Falls back silently to the globals.css defaults if the API is
 * unreachable.
 */
async function BrandStyleOverrides() {
  let tokens: Record<string, string> = {};
  try {
    const res = await fetch(`${API_URL}/settings/brand`, { cache: "no-store" });
    if (res.ok) {
      tokens = deriveBrandTokens((await res.json()) as BrandSettings);
    }
  } catch {
    // API unreachable — defaults in globals.css apply
  }

  if (Object.keys(tokens).length === 0) return null;

  const css = Object.entries(tokens)
    .map(([name, value]) => `${name}:${value};`)
    .join("");

  return <style id="brand-overrides">{`:root{${css}}`}</style>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${nunito.variable}`}>
      <body>
        <BrandStyleOverrides />
        <QueryProvider>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: "var(--font-nunito), sans-serif",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
