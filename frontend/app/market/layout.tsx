import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import MarketLoadingFallback from "@/components/market/MarketLoadingFallback";
import zh from "@/locales/zh";

const title = zh.market_meta_title;
const description = zh.market_meta_description;

/** 根 canonical `/market`；`/market/provider`、`/market/acquisition` 在各自 layout 中覆盖。 */
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

export default function MarketLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<MarketLoadingFallback />}>
      {children}
    </Suspense>
  );
}
