import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_claim_meta_title;
const description = zh.governance_claim_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/governance/distribution-claim",
    languages: {
      "zh-CN": "/governance/distribution-claim",
      en: "/governance/distribution-claim",
      "x-default": "/governance/distribution-claim",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance/distribution-claim",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceDistributionClaimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
