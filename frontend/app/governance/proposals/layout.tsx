import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_proposals_meta_title;
const description = zh.governance_proposals_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/governance/proposals",
    languages: {
      "zh-CN": "/governance/proposals",
      en: "/governance/proposals",
      "x-default": "/governance/proposals",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance/proposals",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceProposalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
