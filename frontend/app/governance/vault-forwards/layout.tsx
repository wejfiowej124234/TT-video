import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_vault_forwards_meta_title;
const description = zh.governance_vault_forwards_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/governance/vault-forwards",
    languages: {
      "zh-CN": "/governance/vault-forwards",
      en: "/governance/vault-forwards",
      "x-default": "/governance/vault-forwards",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/governance/vault-forwards",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GovernanceVaultForwardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
