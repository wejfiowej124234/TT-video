import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.guides_meta_title;
const description = zh.guides_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/guides",
    languages: {
      "zh-CN": "/guides",
      en: "/guides",
      "x-default": "/guides",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/guides",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
