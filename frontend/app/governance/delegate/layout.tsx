import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.governance_delegate_meta_title;
const description = zh.governance_delegate_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    languages: {
      "zh-CN": "/governance/delegate",
      en: "/governance/delegate",
      "x-default": "/governance/delegate",
    },
  },
  openGraph: { title, description, type: "website", url: "/governance/delegate" },
  twitter: { card: "summary_large_image", title, description },
};

export default function GovernanceDelegateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
