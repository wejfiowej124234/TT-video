import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.me_meta_title;
const description = zh.me_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/community/me",
    languages: {
      "zh-CN": "/community/me",
      en: "/community/me",
      "x-default": "/community/me",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/community/me",
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
