import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_meta_title;
const description = zh.me_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/me",
    languages: {
      "zh-CN": "/me",
      en: "/me",
      "x-default": "/me",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/me",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
