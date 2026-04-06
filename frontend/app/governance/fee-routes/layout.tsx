import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_fee_routes_meta_title;
const description = zh.governance_fee_routes_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/governance/fee-routes",
    languages: {
      "zh-CN": "/governance/fee-routes",
      en: "/governance/fee-routes",
      "x-default": "/governance/fee-routes",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance/fee-routes",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceFeeRoutesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
