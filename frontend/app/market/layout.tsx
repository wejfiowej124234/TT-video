import type { Metadata } from "next";
import { Suspense } from "react";
import MarketLoadingFallback from "@/components/market/MarketLoadingFallback";
import zh from "@/locales/zh";

const title = zh.market_meta_title;
const description = zh.market_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/market",
    languages: {
      "zh-CN": "/market",
      en: "/market",
      "x-default": "/market",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/market",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function MarketLayout({
  children,
}: { children: React.ReactNode }) {
  return <Suspense fallback={<MarketLoadingFallback />}>{children}</Suspense>;
}
