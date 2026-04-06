import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_params_meta_title;
const description = zh.governance_params_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/governance/params",
    languages: {
      "zh-CN": "/governance/params",
      en: "/governance/params",
      "x-default": "/governance/params",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance/params",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceParamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
