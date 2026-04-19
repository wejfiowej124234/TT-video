import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.trust_meta_title;
const description = zh.trust_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/trust",
    languages: {
      "zh-CN": "/trust",
      en: "/trust",
      "x-default": "/trust",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/trust",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function TrustLayout({ children }: { children: React.ReactNode }) {
  return children;
}
