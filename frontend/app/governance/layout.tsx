import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 治理门户：metadata 惯例取 zh；页身仍由客户端 i18n。子路由另设 layout 覆 canonical。 */
const title = zh.governance_meta_title;
const description = zh.governance_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/governance",
    languages: {
      "zh-CN": "/governance",
      en: "/governance",
      "x-default": "/governance",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
