import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.guide_register_meta_title;
const description = zh.guide_register_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/guide/register",
    languages: {
      "zh-CN": "/guide/register",
      en: "/guide/register",
      "x-default": "/guide/register",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/guide/register",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GuideRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
