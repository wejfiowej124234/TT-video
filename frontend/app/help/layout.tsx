import type { Metadata } from "next";
import zh from "@/locales/zh";

/** 帮助中心：metadata 惯例取 zh；页面正文仍由客户端 i18n 覆盖。 */
const title = zh.help_meta_title;
const description = zh.help_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/help",
    languages: {
      "zh-CN": "/help",
      en: "/help",
      "x-default": "/help",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/help",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
