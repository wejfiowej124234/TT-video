import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_proposal_detail_meta_title;
const description = zh.governance_proposal_detail_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    languages: {
      "zh-CN": "/governance/proposals/[id]",
      en: "/governance/proposals/[id]",
      "x-default": "/governance/proposals/[id]",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance/proposals/[id]",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceProposalDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
