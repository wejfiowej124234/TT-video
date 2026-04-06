import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.guide_meta_title;
const description = zh.guide_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/guide",
    languages: {
      "zh-CN": "/guide",
      en: "/guide",
      "x-default": "/guide",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/guide",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
