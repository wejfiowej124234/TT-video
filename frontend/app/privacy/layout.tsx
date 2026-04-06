import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 隐私政策：metadata 惯例取 zh；正文仍由客户端 i18n。 */
const title = zh.privacy_meta_title;
const description = zh.privacy_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy",
    languages: {
      "zh-CN": "/privacy",
      en: "/privacy",
      "x-default": "/privacy",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
