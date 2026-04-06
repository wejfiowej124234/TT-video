import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 服务条款：metadata 惯例取 zh；正文仍由客户端 i18n。子路由 `community-guidelines` 另有 layout 覆写 canonical。 */
const title = zh.terms_meta_title;
const description = zh.terms_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/terms",
    languages: {
      "zh-CN": "/terms",
      en: "/terms",
      "x-default": "/terms",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/terms",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
