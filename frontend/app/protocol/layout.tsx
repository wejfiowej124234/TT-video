import type { Metadata } from "next";
import zh from "@/locales/zh";

const title = zh.protocol_paper_meta_title;
const description = zh.protocol_paper_meta_description;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/protocol",
    languages: {
      "zh-CN": "/protocol",
      en: "/protocol",
      "x-default": "/protocol",
    },
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/protocol",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function ProtocolPaperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
