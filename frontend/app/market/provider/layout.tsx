import type { Metadata } from "next";
import type { ReactNode } from "react";
import zh from "@/locales/zh";

const title = zh.market_provider_meta_title;
const description = zh.market_provider_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/market/provider" },
};

export default function MarketProviderLayout({ children }: { children: ReactNode }) {
  return children;
}
