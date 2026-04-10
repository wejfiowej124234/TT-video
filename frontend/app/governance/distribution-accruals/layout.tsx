import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_distribution_accruals_meta_title;
const description = zh.governance_distribution_accruals_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/governance/distribution-accruals",
    languages: {
      "zh-CN": "/governance/distribution-accruals",
      en: "/governance/distribution-accruals",
      "x-default": "/governance/distribution-accruals",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance/distribution-accruals",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceDistributionAccrualsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
