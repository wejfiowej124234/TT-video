import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.disputes_meta_title;
const description = zh.disputes_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/disputes",
    languages: {
      "zh-CN": "/disputes",
      en: "/disputes",
      "x-default": "/disputes",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/disputes",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function DisputesLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
