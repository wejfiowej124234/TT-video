import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 客户端 `router.replace('/market')`；canonical/OG 指真 URL，同 `/network`→`/traveltrust` 口径（04 §3.4）。 */
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

export default function DiscoverLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
