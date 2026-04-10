import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_distribution_accruals_detail_meta_title;
const description = zh.governance_distribution_accruals_detail_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    languages: {
      "zh-CN": "/governance/distribution-accruals/[id]",
      en: "/governance/distribution-accruals/[id]",
      "x-default": "/governance/distribution-accruals/[id]",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance/distribution-accruals/[id]",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceDistributionAccrualDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
